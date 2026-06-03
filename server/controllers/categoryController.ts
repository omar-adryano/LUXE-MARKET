import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { APIError } from '../middleware/errorHandler';

// @desc    Get all categories list
// @route   GET /api/categories
// @access  Public
export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    next(new APIError('Category name is required', 400));
    return;
  }

  try {
    const exists = await Category.findOne({ name });
    if (exists) {
      next(new APIError('A category with that name already exists', 400));
      return;
    }

    const category = await Category.create({ name, description });
    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      next(new APIError('Category deletion target not found', 404));
      return;
    }
    res.json({
      success: true,
      message: 'Category removed successfully',
    });
  } catch (error) {
    next(error);
  }
}
