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
    name: { type: String, required: true },
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
    mrp: { type: Number, required: true, min: 1 },
    price: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator(v) {
          return v <= this.mrp;
        },
        message: 'Selling price cannot be higher than MRP',
      },
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] }, // image URLs; UI shows a swatch placeholder if empty
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', brand: 'text' });
productSchema.index({ brand: 1, category: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
