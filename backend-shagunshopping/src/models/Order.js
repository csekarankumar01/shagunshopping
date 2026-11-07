import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'pending_payment', // Razorpay order created, waiting for payment
  'processing',      // paid (or COD confirmed), being packed
  'shipped',         // handed over to courier
  'delivered',       // arrived at customer doorstep (terminal state)
  'cancelled',       // aborted/refunded (terminal state)
];

export const ALLOWED_STATUS_TRANSITIONS = {
  pending_payment: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot of the product at purchase time, so later edits don't change history
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: [0, 'Item price cannot be negative'] },
    mrp: { type: Number, required: true, min: [0, 'Item MRP cannot be negative'] },
    qty: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      line1: { type: String, required: true, trim: true },
      line2: { type: String, trim: true, default: '' },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
    paymentResult: {
      // NOTE: Omit empty string defaults so sparse & unique indexes only index real transactions
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String, default: '' },
    },
    idempotencyKey: {
      type: String,
    },
    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0 },
    codFee: { type: Number, default: 0, min: 0 },
    trackingUrl: { type: String, trim: true, default: '' },
    totalPrice: { type: Number, required: true, min: 0 },
    isPaid: { type: Boolean, default: false, index: true },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'processing',
      index: true,
    },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

// Keep track of original status on document load to strictly enforce the state machine
orderSchema.post('init', function () {
  this._originalStatus = this.status;
});

// Enforce status state machine transitions and financial arithmetic invariant
orderSchema.pre('save', function (next) {
  // 1. Status state machine validation
  if (!this.isNew && this._originalStatus && this.isModified('status')) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[this._originalStatus] || [];
    if (!allowed.includes(this.status)) {
      return next(
        new Error(
          `Invalid order status transition: Cannot transition order from "${this._originalStatus}" to "${this.status}".`
        )
      );
    }
  }

  // 2. Financial calculation invariant check (cents/paise precision)
  const computedTotal = Math.round(
    ((this.itemsPrice || 0) + (this.shippingPrice || 0) + (this.codFee || 0)) * 100
  ) / 100;

  if (Math.abs(computedTotal - this.totalPrice) > 0.05) {
    return next(
      new Error(
        `Financial invariant violation: Order totalPrice (${this.totalPrice}) does not equal itemsPrice (${this.itemsPrice}) + shippingPrice (${this.shippingPrice}) + codFee (${this.codFee}).`
      )
    );
  }

  next();
});

// Compound & High-Performance Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ isPaid: 1, status: 1, createdAt: -1 });
orderSchema.index({ 'paymentResult.razorpayOrderId': 1 }, { sparse: true });
orderSchema.index({ 'paymentResult.razorpayPaymentId': 1 }, { sparse: true, unique: true });
orderSchema.index({ idempotencyKey: 1 }, { sparse: true, unique: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
