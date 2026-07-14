import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendOrderConfirmationEmail, sendOwnerNewOrderEmail } from '../utils/mailer.js';

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

/**
 * POST /api/payment/verify
 * Body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Razorpay's checkout returns a signature = HMAC_SHA256(order_id + "|" + payment_id)
 * signed with our secret key. Recomputing it here proves the payment really
 * happened and belongs to this exact order -- the client cannot fake it.
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ message: 'This order is not awaiting payment' });
    }
    if (order.paymentResult.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Payment does not match this order' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const valid =
      expected.length === String(razorpay_signature).length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(razorpay_signature)));

    if (!valid) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Reserve stock now that the payment is confirmed. Stock was validated at
    // order creation moments earlier; for a small shop that window is fine.
    const ops = order.orderItems.map((it) => ({
      updateOne: {
        filter: { _id: it.product },
        update: { $inc: { stock: -it.qty } },
      },
    }));
    await Product.bulkWrite(ops);

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'processing';
    order.paymentResult.razorpayPaymentId = razorpay_payment_id;
    order.paymentResult.razorpaySignature = razorpay_signature;
    await order.save();

    sendOrderConfirmationEmail(req.user.email, req.user.name, order); // fire and forget
    sendOwnerNewOrderEmail(order, req.user); // owner alert, fire and forget
    res.json({ order });
  } catch (err) {
    next(err);
  }
};