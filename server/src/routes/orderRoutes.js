import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import { ORDER_STATUSES } from '../models/Order.js';
import {
  createOrder,
  myOrders,
  getOrder,
  cancelOrder,
  adminListOrders,
  updateOrderStatus,
  orderStats,
} from '../controllers/orderController.js';

const router = Router();

router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('Your cart is empty'),
    body('items.*.product').isMongoId().withMessage('Invalid product in cart'),
    body('items.*.qty').isInt({ min: 1, max: 10 }).withMessage('Quantity must be 1 to 10'),
    body('paymentMethod').isIn(['razorpay', 'cod']).withMessage('Choose a payment method'),
    body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('shippingAddress.phone').isMobilePhone('en-IN').withMessage('Enter a valid 10-digit phone number'),
    body('shippingAddress.line1').trim().notEmpty().withMessage('Address is required'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
    body('shippingAddress.pincode').matches(/^\d{6}$/).withMessage('Enter a valid 6-digit PIN code'),
  ],
  validate,
  createOrder
);

router.get('/mine', protect, myOrders);
router.get('/stats/summary', protect, admin, orderStats);
router.get('/', protect, admin, adminListOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.put(
  '/:id/status',
  protect,
  admin,
  [body('status').isIn(ORDER_STATUSES).withMessage('Invalid status')],
  validate,
  updateOrderStatus
);

export default router;
