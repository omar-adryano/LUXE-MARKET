import { Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { APIError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Add a review for a product
// @route   POST /api/reviews
// @access  Private
export async function createReview(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { productId, rating, comment } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      next(new APIError('Review target product not found', 404));
      return;
    }
    const product = await Product.findById(productId);
    if (!product) {
      next(new APIError('Review target product not found', 404));
      return;
    }

    // Check if user already submitted a review
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      next(new APIError('Single review privilege: You have already reviewed this product', 400));
      return;
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export async function getProductReviews(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
export async function deleteReview(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      next(new APIError('Review target not found', 404));
      return;
    }
    const review = await Review.findById(req.params.id);
    if (!review) {
      next(new APIError('Review target not found', 404));
      return;
    }

    // Authorize: user must be the poster of the review, or an admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      next(new APIError('Not authorized to delete this review', 403));
      return;
    }

    // We can trigger schema hooks by calling deleteOne on document
    await review.deleteOne();

    res.json({
      success: true,
      message: 'Review removed successfully',
    });
  } catch (error) {
    next(error);
  }
}
