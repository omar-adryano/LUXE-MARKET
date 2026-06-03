import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { APIError } from '../middleware/errorHandler';

// @desc    Get all products with searching and filtering
// @route   GET /api/products
// @access  Public
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { category, search, sort } = req.query;

  const query: any = {};

  if (category && category !== 'All' && category !== '') {
    query.category = { $regex: new RegExp(category as string, 'i') };
  }

  if (search && search !== '') {
    query.$or = [
      { name: { $regex: new RegExp(search as string, 'i') } },
      { description: { $regex: new RegExp(search as string, 'i') } },
    ];
  }

  try {
    let apiCall = Product.find(query);

    // Dynamic High Density Sorting Option
    if (sort === 'price-asc') {
      apiCall = apiCall.sort({ price: 1 });
    } else if (sort === 'price-desc') {
      apiCall = apiCall.sort({ price: -1 });
    } else if (sort === 'rating') {
      apiCall = apiCall.sort({ rating: -1 });
    } else {
      apiCall = apiCall.sort({ createdAt: -1 }); // default newest items
    }

    const products = await apiCall;
    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Public
export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      next(new APIError('Requested product not found', 404));
      return;
    }
    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productData = {
      ...req.body,
      source: req.body.source || 'manual',
    };
    const product = await Product.create(productData);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Update a product listing
// @route   PUT /api/products/:id
// @access  Private/Admin
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      next(new APIError('Product details update target not found', 404));
      return;
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Delete a product item
// @route   DELETE /api/products/:id
// @access  Private/Admin
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      next(new APIError('Product deletion target not found', 404));
      return;
    }
    res.json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    next(error);
  }
}
