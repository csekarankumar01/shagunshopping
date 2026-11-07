import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { InventoryLockService } from '../services/inventoryLockService.js';
import { publishDomainEvent, TOPICS } from '../events/eventProducer.js';
import { withTransaction } from '../utils/transaction.js';
import { sendOrderConfirmationEmail, sendOwnerNewOrderEmail } from '../utils/mailer.js';

let client = null;

export const getRazorpay = () => {
  if (!client) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials are not configured in environment');
    }
    client = new Razorpay({ key_id, key_secret });
  }
  return client;
};

// Timing-safe HMAC comparison prevents byte-by-byte timing attacks on the signature
const timingSafeMatch = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Idempotent order finalization with ACID multi-document transaction support.
 *
 * Atomically transitions order status from 'pending_payment' to 'processing'
 * and deducts stock in MongoDB with $gte guards. Exactly one caller wins;
 * any subsequent callers (e.g. webhooks racing with browser verify) safely read
 * the already-finalized order.
 */
export const finalizePaidOrder = async (orderId, razorpayPaymentId, razorpaySignature = '') => {
  return await withTransaction(async (session) => {
    const claimed = await Order.findOneAndUpdate(
      { _id: orderId, status: 'pending_payment', isPaid: false },
      {
        $set: {
          isPaid: true,
          paidAt: new Date(),
          status: 'processing',
          'paymentResult.razorpayPaymentId': razorpayPaymentId,
          ...(razorpaySignature ? { 'paymentResult.razorpaySignature': razorpaySignature } : {}),
        },
      },
      { new: true, session }
    );

    if (!claimed) {
      // Already finalized by webhook or concurrent call
      const existing = session
        ? await Order.findById(orderId).session(session)
        : await Order.findById(orderId);
      return { order: existing, alreadyProcessed: true };
    }

    // Commit the Redis inventory reservation & persist MongoDB deduction within the transaction
    await InventoryLockService.commitInventory(claimed._id.toString(), claimed.orderItems, session);

    // Emit event to Kafka
    await publishDomainEvent(TOPICS.PAYMENT_EVENTS, 'PAYMENT_CAPTURED', claimed._id, {
      orderId: claimed._id,
      razorpayPaymentId,
      totalPrice: claimed.totalPrice,
      items: claimed.orderItems,
    });

    const buyerQuery = User.findById(claimed.user).select('name email');
    const buyer = session ? await buyerQuery.session(session) : await buyerQuery;
    if (buyer) {
      sendOrderConfirmationEmail(buyer.email, buyer.name, claimed); // fire and forget
      sendOwnerNewOrderEmail(claimed, buyer);
    }

    return { order: claimed, alreadyProcessed: false };
  });
};

/**
 * POST /api/payment/verify (browser callback after the Razorpay popup)
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (order.paymentResult?.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Payment does not match this order' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (!timingSafeMatch(expected, razorpay_signature)) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const { order: finalOrder } = await finalizePaidOrder(order._id, razorpay_payment_id, razorpay_signature);
    res.json({ order: finalOrder });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payment/webhook — Razorpay's server-to-server webhook callback.
 */
export const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('Razorpay webhook hit but RAZORPAY_WEBHOOK_SECRET is not set');
    return res.status(503).json({ message: 'Webhook not configured' });
  }
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body; // Buffer (express.raw)
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!signature || !timingSafeMatch(expected, signature)) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        const order = await Order.findOne({ 'paymentResult.razorpayOrderId': payment.order_id });
        if (order) {
          await finalizePaidOrder(order._id, payment.id);
        } else {
          console.warn('Webhook payment.captured for unknown razorpay order:', payment.order_id);
        }
      }
    }
    // Always return 200 fast so Razorpay stops retrying
    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing failed:', err.message);
    res.status(500).json({ message: 'Webhook error' });
  }
};
