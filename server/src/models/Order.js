import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'pending_payment', // Razorpay order created, waiting for payment
  'processing', // paid (or COD confirmed), being packed
  'shipped',
  'delivered',
  'cancelled',
];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot of the product at purchase time, so later edits don't change history
    name: { type: String, required: true },
    brand: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: { type: [orderItemSchema], required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
    paymentResult: {
      razorpayOrderId: { type: String, default: '' },
      razorpayPaymentId: { type: String, default: '' },
      razorpaySignature: { type: String, default: '' },
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    codFee: { type: Number, default: 0 },
    trackingUrl: { type: String, trim: true, default: '' },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    status: { type: String, enum: ORDER_STATUSES, default: 'processing' },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
