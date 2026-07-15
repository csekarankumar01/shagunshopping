import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { computeTotals, getShippingRules } from '../utils/pricing.js';
import { getRazorpay } from './paymentController.js';
import {
  sendOrderConfirmationEmail,
  sendOwnerNewOrderEmail,
  sendOrderStatusEmail,
  sendOwnerCancelledEmail,
} from '../utils/mailer.js';

/**
 * Atomically decrement stock for every item. Each update only matches if
 * enough stock is still available, which prevents overselling under
 * concurrent checkouts.
 */
const decrementStock = async (items) => {
  const ops = items.map((it) => ({
    updateOne: {
      filter: { _id: it.product, stock: { $gte: it.qty } },
      update: { $inc: { stock: -it.qty } },
    },
  }));
  const result = await Product.bulkWrite(ops);
  return result.modifiedCount === items.length;
};

const restoreStock = async (items) => {
  const ops = items.map((it) => ({
    updateOne: {
      filter: { _id: it.product },
      update: { $inc: { stock: it.qty } },
    },
  }));
  await Product.bulkWrite(ops);
};

// POST /api/orders
// Body: { items: [{ product, qty }], shippingAddress, paymentMethod: 'cod' | 'razorpay' }
export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    // Load live products from DB -- prices are NEVER taken from the client
    const ids = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: ids }, isActive: true });
    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = [];
    for (const item of items) {
      const p = byId.get(String(item.product));
      if (!p) {
        return res.status(400).json({ message: 'One of the items is no longer available' });
      }
      if (p.stock < item.qty) {
        return res.status(409).json({
          message: `Only ${p.stock} left in stock for "${p.name}"`,
        });
      }
      orderItems.push({
        product: p._id,
        name: p.name,
        brand: p.brand,
        image: p.images[0] || '',
        price: p.price,
        mrp: p.mrp,
        qty: item.qty,
      });
    }

    const totals = computeTotals(orderItems, paymentMethod);

    // COD is capped — large orders must be prepaid (RTO protection)
    if (paymentMethod === 'cod') {
      const { codMax } = getShippingRules();
      if (totals.itemsPrice > codMax) {
        return res.status(400).json({
          message: `Cash on delivery is available up to ₹${codMax.toLocaleString('en-IN')} — please pay online for larger orders`,
        });
      }
    }

    // ---- Cash on delivery: confirm immediately ----
    if (paymentMethod === 'cod') {
      const ok = await decrementStock(orderItems);
      if (!ok) {
        return res.status(409).json({ message: 'Stock changed while ordering, please try again' });
      }
      const order = await Order.create({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod: 'cod',
        ...totals,
        status: 'processing',
      });
      sendOrderConfirmationEmail(req.user.email, req.user.name, order); // fire and forget
      sendOwnerNewOrderEmail(order, req.user); // owner alert, fire and forget
      return res.status(201).json({ order });
    }

    // ---- Razorpay: create an unpaid order + a Razorpay order ----
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod: 'razorpay',
      ...totals,
      status: 'pending_payment',
    });

    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(totals.totalPrice * 100), // paise
      currency: 'INR',
      receipt: order._id.toString(),
    });
    order.paymentResult.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.status(201).json({
      order,
      razorpay: {
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        name: process.env.SHOP_NAME || 'Our Store',
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/mine
export const myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id (owner or admin)
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isOwner = order.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// PUT /api/orders/:id/cancel (owner, before shipping)
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (!['pending_payment', 'processing'].includes(order.status)) {
      return res.status(400).json({ message: 'This order can no longer be cancelled' });
    }

    // Stock was only reserved for COD orders and paid Razorpay orders
    const stockWasReserved = order.paymentMethod === 'cod' || order.isPaid;
    if (stockWasReserved) await restoreStock(order.orderItems);

    order.status = 'cancelled';
    await order.save();
    // Note: refunds for paid orders are issued manually from the Razorpay dashboard.
    sendOwnerCancelledEmail(order, req.user); // fire and forget
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin ----------

// GET /api/orders?page=&status=
export const adminListOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ orders, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    next(err);
  }
};

// PUT /api/orders/:id/status  Body: { status }
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      // COD money is collected at the door
      if (order.paymentMethod === 'cod' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }
    await order.save();

    // Keep the customer in the loop (shipped / delivered / cancelled)
    if (order.user?.email && ['shipped', 'delivered', 'cancelled'].includes(status)) {
      sendOrderStatusEmail(order.user.email, order.user.name, order); // fire and forget
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/stats/summary (admin dashboard)
export const orderStats = async (req, res, next) => {
  try {
    const [revenueAgg, totalOrders, processing, productsCount, lowStock, recent] =
      await Promise.all([
        Order.aggregate([
          { $match: { isPaid: true, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, revenue: { $sum: '$totalPrice' } } },
        ]),
        Order.countDocuments({}),
        Order.countDocuments({ status: 'processing' }),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
        Order.find({}).populate('user', 'name').sort({ createdAt: -1 }).limit(6),
      ]);

    res.json({
      revenue: revenueAgg[0]?.revenue || 0,
      totalOrders,
      processing,
      productsCount,
      lowStock,
      recent,
    });
  } catch (err) {
    next(err);
  }
};
