import { Schema, model } from 'mongoose';
import { wrapModelWithFallback } from './fallback';

const shippingCacheSchema = new Schema(
  {
    vid: {
      type: String,
      required: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
      index: true,
    },
    logisticsName: {
      type: String,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    estimatedDays: {
      type: String,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      index: { expires: '7d' }, // Auto-delete after 7 days for example, or simply update via chron job
    },
  },
  {
    timestamps: true,
  }
);

export const ShippingCache = wrapModelWithFallback(model('ShippingCache', shippingCacheSchema), 'ShippingCache');
