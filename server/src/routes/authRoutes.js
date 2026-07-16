import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { register, login, logout, me, updateProfile, verifyOtp, resendOtp, addAddress, updateAddress, deleteAddress, forgotPassword, resetPassword } from '../controllers/authController.js';
import { requireCaptcha } from '../utils/captcha.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional({ values: 'falsy' }).isMobilePhone('en-IN').withMessage('Enter a valid 10-digit phone number'),
  ],
  validate,
  requireCaptcha,
  register
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Enter a valid email').normalizeEmail()],
  validate,
  requireCaptcha,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Enter the 6-digit code'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  resetPassword
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', logout);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Enter the 6-digit code'),
  ],
  validate,
  verifyOtp
);

router.post(
  '/resend-otp',
  [body('email').isEmail().withMessage('Enter a valid email').normalizeEmail()],
  validate,
  resendOtp
);

router.get('/me', protect, me);
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 1, max: 60 }),
    body('password').optional({ values: 'falsy' }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('preferredPayment').optional().isIn(['razorpay', 'cod']).withMessage('Invalid payment preference'),
  ],
  validate,
  updateProfile
);

const addressRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').isMobilePhone('en-IN').withMessage('Enter a valid 10-digit phone number'),
  body('line1').trim().notEmpty().withMessage('Address is required'),
  body('line2').optional({ values: 'falsy' }).trim(),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').matches(/^\d{6}$/).withMessage('Enter a valid 6-digit PIN code'),
  body('isDefault').optional().isBoolean(),
];

router.post('/addresses', protect, addressRules, validate, addAddress);
router.put('/addresses/:addressId', protect, addressRules, validate, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

export default router;
