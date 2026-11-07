import Order from '../models/Order.js';
import { getRazorpay, finalizePaidOrder } from '../controllers/paymentController.js';
import { InventoryLockService } from './inventoryLockService.js';
import { publishDomainEvent, TOPICS } from '../events/eventProducer.js';

/**
 * Reconciles orders stuck in 'pending_payment'.
 * Solves the "Ghost Payment" problem where the user completed payment on Razorpay
 * but closed their browser before the client callback / verify endpoint was hit.
 */
export const reconcilePendingPayments = async () => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return { scanned: 0, reconciled: 0, expired: 0 };
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Find pending Razorpay orders created at least 10 minutes ago
    const pendingOrders = await Order.find({
      status: 'pending_payment',
      paymentMethod: 'razorpay',
      createdAt: { $lte: tenMinutesAgo },
    }).limit(50);

    let reconciledCount = 0;
    let expiredCount = 0;

    const razorpay = getRazorpay();

    for (const order of pendingOrders) {
      const rzpOrderId = order.paymentResult?.razorpayOrderId;
      if (!rzpOrderId) continue;

      try {
        const paymentsResponse = await razorpay.orders.fetchPayments(rzpOrderId);
        const payments = paymentsResponse?.items || [];

        // Check if any payment was captured
        const capturedPayment = payments.find((p) => p.status === 'captured');

        if (capturedPayment) {
          console.log(`[Reconciliation] Found captured payment ${capturedPayment.id} for order ${order._id}. Finalizing...`);
          await finalizePaidOrder(order._id, capturedPayment.id);
          reconciledCount++;
        } else if (order.createdAt <= twoHoursAgo) {
          // If older than 2 hours and no captured payment, cancel the order and release inventory locks
          console.log(`[Reconciliation] Order ${order._id} expired without payment. Cancelling and releasing locks...`);
          order.status = 'cancelled';
          await order.save();

          await InventoryLockService.releaseInventory(order._id.toString(), order.orderItems);

          await publishDomainEvent(TOPICS.ORDER_EVENTS, 'ORDER_CANCELLED', order._id, {
            orderId: order._id,
            reason: 'Payment timeout (2 hours expired)',
          });

          expiredCount++;
        }
      } catch (err) {
        console.warn(`[Reconciliation] Error checking Razorpay order ${rzpOrderId}: ${err.message}`);
      }
    }

    if (reconciledCount > 0 || expiredCount > 0) {
      console.log(`[Reconciliation] Summary: ${reconciledCount} orders confirmed, ${expiredCount} expired orders cancelled.`);
    }

    return { scanned: pendingOrders.length, reconciled: reconciledCount, expired: expiredCount };
  } catch (err) {
    console.error('[Reconciliation] Error during reconciliation cycle:', err.message);
    return { error: err.message };
  }
};

/**
 * Starts the recurring 10-minute reconciliation daemon.
 */
export const setupPaymentReconciliation = () => {
  const INTERVAL_MS = Number(process.env.RECONCILIATION_INTERVAL_MS) || 10 * 60 * 1000; // default 10 minutes

  console.log(`[Reconciliation] Daemon scheduled to run every ${INTERVAL_MS / 60000} minutes`);

  setInterval(async () => {
    try {
      await reconcilePendingPayments();
    } catch (err) {
      console.error('[Reconciliation Daemon Error]:', err.message);
    }
  }, INTERVAL_MS);
};

