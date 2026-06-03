import { Request, Response, NextFunction } from 'express';
import { APIError } from './errorHandler';

export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { name, email, password } = req.body;
  if (!name || name.trim() === '') {
    next(new APIError('Name registration field is required', 400));
    return;
  }
  if (!email || !email.includes('@')) {
    next(new APIError('A valid email address is required', 400));
    return;
  }
  if (!password || password.length < 6) {
    next(new APIError('Password must be at least 6 characters long', 400));
    return;
  }
  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;
  if (!email || !password) {
    next(new APIError('Please provide both email and password', 400));
    return;
  }
  next();
}

export function validateProduct(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'POST') {
    const { name, category, price, image } = req.body;
    if (!name) {
      next(new APIError('Product Name is required', 400));
      return;
    }
    if (!category) {
      next(new APIError('Product Category is required', 450));
      return;
    }
    if (price === undefined || price < 0) {
      next(new APIError('Product Price must be a positive number', 400));
      return;
    }
    if (!image) {
      next(new APIError('Product Image URL is required', 400));
      return;
    }
  } else if (req.method === 'PUT') {
    const { price } = req.body;
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      next(new APIError('Product Price must be a positive number', 400));
      return;
    }
  }
  next();
}

export function validateOrder(req: Request, res: Response, next: NextFunction): void {
  const { items, shippingAddress, total } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    next(new APIError('Order items list is required and cannot be empty', 400));
    return;
  }
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
    next(new APIError('A complete shipping address is required for checkout', 400));
    return;
  }
  if (total === undefined || total <= 0) {
    next(new APIError('Order total calculation must be positive', 400));
    return;
  }
  next();
}

export function validateReview(req: Request, res: Response, next: NextFunction): void {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    next(new APIError('Product rating is required and must stand between 1 and 5', 400));
    return;
  }
  if (!comment || comment.trim() === '') {
    next(new APIError('Review comment text content is required', 400));
    return;
  }
  next();
}
