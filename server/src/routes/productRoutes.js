import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import { CATEGORIES } from '../models/Product.js';
import {
  listProducts,
  getFilters,
  getProduct,
  addReview,
  adminListProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = Router();

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 140 }),
  body('brand').trim().notEmpty().withMessage('Brand is required').isLength({ max: 60 }),
  body('category').isIn(CATEGORIES).withMessage('Choose a valid category'),
  body('mrp').isFloat({ min: 1 }).withMessage('MRP must be at least ₹1'),
  body('price').isFloat({ min: 1 }).withMessage('Price must be at least ₹1'),
  body('stock').isInt({ min: 0 }).withMessage('Stock cannot be negative'),
  body('size').optional().trim().isLength({ max: 40 }),
  body('ingredients').optional().trim().isLength({ max: 2000 }),
  body('howToUse').optional().trim().isLength({ max: 2000 }),
  body('images').optional().isArray({ max: 20 }).withMessage('Up to 20 images'),
  body('images.*')
    .optional()
    .custom((v) => {
      // Accept full http(s) URLs or site-relative paths like /products/foo.svg
      const isUrl = /^https?:\/\/\S+$/i.test(v);
      const isRelative = /^\/[\w\-./]+$/.test(v);
      if (!isUrl && !isRelative) throw new Error('Each image must be a URL or a /path on this site');
      return true;
    }),
];

router.get('/', listProducts);
router.get('/filters', getFilters);
router.get('/admin/all', protect, admin, adminListProducts);
router.get('/:id', getProduct);

router.post(
  '/:id/reviews',
  protect,
  [body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1 to 5')],
  validate,
  addReview
);

router.post('/', protect, admin, productRules, validate, createProduct);
router.put('/:id', protect, admin, productRules, validate, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
