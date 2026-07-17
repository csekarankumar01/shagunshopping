import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendOrderConfirmationEmail, sendOwnerNewOrderEmail, sendOversellAlert } from '../utils/mailer.js';

let client = null;

/** Lazily create the Razorpay client so the app can boot without keys in dev. */
export const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error('Razorpay keys are not configured on the server');
    err.statusCode = 500;
    throw err;
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
};

const timingSafeMatch = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// The heart of payment safety: mark an order paid EXACTLY ONCE, no matter
// who calls this or how many times (browser verify, webhook, double-clicks,
// network retries — I got bitten by imagining all of these racing).
//
// The trick is that the idempotency key is an atomic status transition:
// findOneAndUpdate only matches while status is still 'pending_payment', so
// exactly one caller wins the claim; everyone else gets null and just reads
// back the already-finalized order. The winner then decrements stock (with
// $gte guards) and sends the emails. No locks, no flags — Mongo's own
// document atomicity does the work.
const finalizePaidOrder = async (orderId, razorpayPaymentId, razorpaySignature = '') => {
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
    { new: true }
  );

  if (!claimed) {
    // Someone (the webhook or a retry) already finalized it — idempotent no-op.
    return { order: await Order.findById(orderId), alreadyProcessed: true };
  }

  // Decrement stock with guards; count how many actually applied.
  const ops = claimed.orderItems.map((it) => ({
    updateOne: {
      filter: { _id: it.product, stock: { $gte: it.qty } },
      update: { $inc: { stock: -it.qty } },
    },
  }));
  const result = await Product.bulkWrite(ops);
  if ((result.modifiedCount ?? 0) < claimed.orderItems.length) {
    // Extremely rare: stock ran out between order creation and payment.
    // The customer HAS paid, so the order stays paid — alert the owner to
    // source the item, arrange a substitute, or refund. Never fail silently.
    sendOversellAlert(claimed); // fire and forget
  }

  const buyer = await User.findById(claimed.user).select('name email');
  if (buyer) {
    sendOrderConfirmationEmail(buyer.email, buyer.name, claimed); // fire and forget
    sendOwnerNewOrderEmail(claimed, buyer); // fire and forget
  }
  return { order: claimed, alreadyProcessed: false };
};

/**
 * POST /api/payment/verify  (browser callback after the Razorpay popup)
 * Signature = HMAC_SHA256(order_id + "|" + payment_id) with our key secret —
 * recomputing it proves the payment really happened for this exact order.
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (order.paymentResult.razorpayOrderId !== razorpay_order_id) {
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

// POST /api/payment/webhook — Razorpay's server calls OURS directly.
// This closes the scariest gap I found in my own audit: customer pays, then
// closes the tab before the browser can call /verify → money taken, order
// stuck unpaid. Now Razorpay tells us server-to-server.
// Gotcha that cost me an hour: the webhook signature is an HMAC of the RAW
// request bytes, so this route is mounted with express.raw() BEFORE the JSON
// parser in app.js — parse first and the signature never matches.
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
    // Always 200 fast so Razorpay stops retrying.
    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing failed:', err.message);
    res.status(500).json({ message: 'Webhook error' });
  }
};
