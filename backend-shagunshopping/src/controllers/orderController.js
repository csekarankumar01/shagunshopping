import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { clearProductCache } from '../utils/cache.js';
import { computeTotals, getShippingRules } from '../utils/pricing.js';
import { getRazorpay } from './paymentController.js';
import { InventoryLockService } from '../services/inventoryLockService.js';
import { publishDomainEvent, TOPICS } from '../events/eventProducer.js';
import { withTransaction } from '../utils/transaction.js';
import {
  sendOrderConfirmationEmail,
  sendOwnerNewOrderEmail,
  sendOrderStatusEmail,
  sendOwnerCancelledEmail,
} from '../utils/mailer.js';

/**
 * Atomically decrement stock for every item with strict stock >= qty guards.
 * Supports optional MongoDB transactional session.
 */
export const decrementStock = async (items, session = null) => {
  const ops = items.map((it) => ({
    updateOne: {
      filter: { _id: it.product, stock: { $gte: it.qty } },
      update: { $inc: { stock: -it.qty } },
    },
  }));
  const bulkOptions = session ? { session } : {};
  const result = await Product.bulkWrite(ops, bulkOptions);
  if (result.modifiedCount > 0) clearProductCache();
  return result.modifiedCount === items.length;
};

/**
 * Restores stock for items (used on cancellation or failed checkout rollback).
 */
export const restoreStock = async (items, session = null) => {
  const ops = items.map((it) => ({
    updateOne: {
      filter: { _id: it.product },
      update: { $inc: { stock: it.qty } },
    },
  }));
  const bulkOptions = session ? { session } : {};
  await Product.bulkWrite(ops, bulkOptions);
  clearProductCache();
};

// POST /api/orders
// Body: { items: [{ product, qty }], shippingAddress, paymentMethod: 'cod' | 'razorpay', idempotencyKey?: string }
export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;

    // Idempotency guard: Return existing order if key was already submitted
    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey, user: req.user._id });
      if (existing) {
        return res.status(200).json({ order: existing, isDuplicate: true });
      }
    }

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

    // COD capped: big COD orders are prepaid only
    if (paymentMethod === 'cod') {
      const { codMax } = getShippingRules();
      if (totals.itemsPrice > codMax) {
        return res.status(400).json({
          message: `Cash on delivery is available up to ₹${codMax.toLocaleString('en-IN')} — please pay online for larger orders`,
        });
      }
    }

    // ---- Cash on delivery: ACID multi-document transaction ----
    if (paymentMethod === 'cod') {
      const order = await withTransaction(async (session) => {
        const ok = await decrementStock(orderItems, session);
        if (!ok) {
          throw new Error('STOCK_UNAVAILABLE');
        }

        const [created] = await Order.create(
          [
            {
              user: req.user._id,
              orderItems,
              shippingAddress,
              paymentMethod: 'cod',
              ...totals,
              status: 'processing',
              idempotencyKey: idempotencyKey || undefined,
            },
          ],
          { session }
        );
        return created;
      });

      sendOrderConfirmationEmail(req.user.email, req.user.name, order); // fire and forget
      sendOwnerNewOrderEmail(order, req.user);
      return res.status(201).json({ order });
    }

    // ---- Razorpay: reserve stock atomically in Redis & create pending order ----
    const tempOrderId = `${req.user._id}-${Date.now()}`;
    const reservation = await InventoryLockService.reserveInventory(tempOrderId, orderItems, 600); // 10 min hold
    if (!reservation.success) {
      return res.status(409).json({
        message: reservation.reason || 'One of the items in your cart was just reserved by another customer. Please try again shortly.',
      });
    }

    let order;
    try {
      order = await Order.create({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod: 'razorpay',
        ...totals,
        status: 'pending_payment',
        idempotencyKey: idempotencyKey || undefined,
      });
    } catch (createErr) {
      // Abort Redis reservation immediately if MongoDB order creation fails
      await InventoryLockService.releaseInventory(tempOrderId, orderItems);
      throw createErr;
    }

    // Re-link the reservation key from temp ID to the permanent order ID
    await InventoryLockService.reserveInventory(order._id.toString(), orderItems, 600);
    await InventoryLockService.releaseInventory(tempOrderId, orderItems);

    await publishDomainEvent(TOPICS.ORDER_EVENTS, 'ORDER_CREATED', order._id, {
      orderId: order._id,
      userId: req.user._id,
      totalPrice: totals.totalPrice,
      items: orderItems,
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
    if (err.message === 'STOCK_UNAVAILABLE') {
      return res.status(409).json({ message: 'Stock changed while ordering, please try again' });
    }
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

    const stockWasReserved = order.paymentMethod === 'cod' || order.isPaid;

    await withTransaction(async (session) => {
      if (stockWasReserved) {
        await restoreStock(order.orderItems, session);
      }
      order.status = 'cancelled';
      await order.save({ session });
    });

    // Also release any active Redis soft-locks for pending orders
    await InventoryLockService.releaseInventory(order._id.toString(), order.orderItems);

    await publishDomainEvent(TOPICS.ORDER_EVENTS, 'ORDER_CANCELLED', order._id, {
      orderId: order._id,
      items: order.orderItems,
    });

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

// PUT /api/orders/:id/status  Body: { status, trackingUrl }
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingUrl } = req.body;
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
    if (typeof trackingUrl === 'string' && /^https?:\/\//.test(trackingUrl.trim())) {
      order.trackingUrl = trackingUrl.trim();
    }
    await order.save();

    // Keep the customer in the loop (shipped / delivered / cancelled)
    if (order.user?.email && ['shipped', 'delivered', 'cancelled'].includes(status)) {
      sendOrderStatusEmail(order.user.email, order.user.name, order);
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
