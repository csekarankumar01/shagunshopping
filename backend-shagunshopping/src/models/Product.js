import mongoose from 'mongoose';

export const CATEGORIES = [
  'Skincare',
  'Haircare',
  'Makeup',
  'Body Care',
  'Fragrance',
  'Wellness',
];

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    brand: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: String, required: true, enum: CATEGORIES },
    description: { type: String, trim: true, maxlength: 4000, default: '' },
    // In-depth product details shown on the product page
    size: { type: String, trim: true, maxlength: 40, default: '' }, // e.g. "50 ml" / "100 g"
    ingredients: { type: String, trim: true, maxlength: 2000, default: '' },
    howToUse: { type: String, trim: true, maxlength: 2000, default: '' },
    // MRP printed on the pack vs the shop's selling price (must be <= mrp)
    mrp: { type: Number, required: true, min: [1, 'MRP must be at least ₹1'] },
    price: {
      type: Number,
      required: true,
      min: [1, 'Selling price must be at least ₹1'],
      validate: {
        validator(v) {
          return v <= this.mrp;
        },
        message: 'Selling price cannot be higher than MRP',
      },
    },
    // Guaranteed non-negative stock invariant
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer',
      },
    },
    images: { type: [String], default: [] }, // image URLs; UI shows a swatch placeholder if empty
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    reviews: [reviewSchema],
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Prevents lost updates on concurrent document saves
  }
);

// High-Throughput Compound & Covering Indexes
productSchema.index({ _id: 1, stock: 1 });
productSchema.index({ name: 'text', brand: 'text' });
productSchema.index({ brand: 1, category: 1, isActive: 1 });
productSchema.index({ isActive: 1, featured: 1, createdAt: -1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });
productSchema.index({ isActive: 1, brand: 1, createdAt: -1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, price: -1 });
productSchema.index({ isActive: 1, rating: -1, numReviews: -1 });

// Automatic Redis inventory synchronization when stock or status changes
productSchema.post('save', async function (doc) {
  if (doc.isModified('stock') || doc.isModified('isActive')) {
    try {
      const { InventoryLockService } = await import('../services/inventoryLockService.js');
      await InventoryLockService.syncStock(doc._id);
    } catch {
      // Redis sync is opportunistic; will be lazily loaded from DB if unseeded
    }
  }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
