import { Response, NextFunction } from 'express';
import { Wishlist } from '../models/Wishlist';
import { Product } from '../models/Product';
import { APIError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
export async function getWishlist(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    
    // Safety fallback if for some reason pre-save hook didn't create a wishlist
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.json({
      success: true,
      wishlist: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Toggle item in wishlist (Add/Remove)
// @route   POST /api/wishlist/toggle
// @access  Private
export async function toggleWishlistItem(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { productId } = req.body;

  if (!productId) {
    next(new APIError('Product ID is required to update wishlist selection', 400));
    return;
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      next(new APIError('Target product does not exist in catalog records', 404));
      return;
    }
    const product = await Product.findById(productId);
    if (!product) {
      next(new APIError('Target product does not exist in catalog records', 404));
      return;
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.indexOf(productId);
    let isAdded = false;

    if (index > -1) {
      // Already present, pull it out
      wishlist.products.splice(index, 1);
    } else {
      // Not present, push it in
      wishlist.products.push(productId);
      isAdded = true;
    }

    await wishlist.save();
    
    // Re-populate and send
    const populated = await wishlist.populate('products');

    res.json({
      success: true,
      isAdded,
      message: isAdded ? 'Added to wishlist successfully' : 'Removed from wishlist successfully',
      wishlist: populated.products,
    });
  } catch (error) {
    next(error);
  }
}
