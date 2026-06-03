import { Schema, model } from 'mongoose';
import { Product } from './Product';
import { wrapModelWithFallback } from './fallback';

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    userName: {
      type: String,
      required: [true, 'Please provide user name for the review'],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must associate with a product'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    comment: {
      type: String,
      required: [true, 'Please add review comment content'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from leaving more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate and update a product's average rating
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        numReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      numReviews: stats[0].numReviews,
      rating: parseFloat(stats[0].averageRating.toFixed(1)),
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      numReviews: 0,
      rating: 5,
    });
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', async function () {
  const reviewModel = this.constructor as any;
  await reviewModel.calculateAverageRating(this.product);
});

// Call calculateAverageRating after delete
reviewSchema.pre('deleteOne', { document: true, query: false }, async function (this: any, next: any) {
  try {
    const reviewModel = this.constructor as any;
    await reviewModel.calculateAverageRating(this.product);
    next();
  } catch (err: any) {
    next(err);
  }
});

export const Review = wrapModelWithFallback(model('Review', reviewSchema), 'Review');

