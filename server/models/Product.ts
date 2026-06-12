import { Schema, model } from 'mongoose';
import { wrapModelWithFallback } from './fallback';

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category name'],
      trim: true,
    },
    cjCategory: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price must be positive'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price must be positive'],
    },
    discount: {
      type: Number,
      min: [0, 'Discount must be at least 0'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    color: {
      type: String,
      trim: true,
    },
    colors: [
      {
        type: String,
        trim: true,
      },
    ],
    materials: [
      {
        type: String,
        trim: true,
      },
    ],
    image: {
      type: String,
      required: [true, 'Please provide a main image URL'],
    },
    thumbnails: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    features: [
      {
        type: String,
      },
    ],
    altDescription: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide inventory stock level'],
      default: 50,
      min: [0, 'Stock cannot be negative'],
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ['aliexpress', 'cj', 'manual'],
      default: 'manual',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    aliexpressRemovedFromSync: {
      type: Boolean,
      default: false,
    },
    aliexpressProductId: {
      type: String,
      trim: true,
    },
    aliexpressUrl: {
      type: String,
      trim: true,
    },
    vid: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
    },
    dimensions: {
      type: Schema.Types.Mixed,
    },
    sourceCountry: {
      type: String,
      trim: true,
    },
    warehouse: {
      type: String,
      trim: true,
    },
    priceReset: {
      type: Boolean,
      default: false
    },
    isManualPrice: {
      type: Boolean,
      default: false
    },
    cjVariants: {
      type: [Schema.Types.Mixed],
      default: []
    }
  },
  {
    timestamps: true,
  }
);

export const Product = wrapModelWithFallback(model('Product', productSchema), 'Product');

