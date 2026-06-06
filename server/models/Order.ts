import { Schema, model } from 'mongoose';
import { wrapModelWithFallback } from './fallback';

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  price: { type: Number, required: true },
  selectedColor: { type: String },
  selectedMaterial: { type: String },
});

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for Guest Checkout!
    },
    items: [orderItemSchema],
    itemsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    itemsSummary: {
      type: String,
      required: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      firstName: { type: String, required: false },
      lastName: { type: String, required: false },
      street: { type: String, required: true },
      apartmentUnit: { type: String, required: false },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: false },
      email: { type: String, required: false },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Credit Card',
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0.0,
    },
    total: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Shipped', 'Processing', 'Delivered', 'Pending'],
      default: 'Pending',
    },
    trackingStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    stripeSessionId: {
      type: String,
      required: false,
    },
    stripePaymentIntentId: {
      type: String,
      required: false,
    },
    stripeTransactionId: {
      type: String,
      required: false,
    },
    cjOrderId: {
      type: String,
      required: false,
    },
    trackingNumber: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = wrapModelWithFallback(model('Order', orderSchema), 'Order');

