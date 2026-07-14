import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { verifyPayment } from '../controllers/paymentController.js';

const router = Router();

router.post(
  '/verify',
  protect,
  [
    body('orderId').isMongoId(),
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
  ],
  validate,
  verifyPayment
);

export default router;
