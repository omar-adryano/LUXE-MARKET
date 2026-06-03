import { Schema, model } from 'mongoose';
import { wrapModelWithFallback } from './fallback';

const wishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wishlist must belong to a user'],
      unique: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Wishlist = wrapModelWithFallback(model('Wishlist', wishlistSchema), 'Wishlist');

