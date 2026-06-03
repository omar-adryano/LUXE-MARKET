import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { APIError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_high_density_token_key';

// Authenticate and protect routers
export async function protect(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(new APIError('Not authorized, no token provided', 401));
    return;
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Find matching user, excluding password field
    const user = await User.findById(decoded.id);
    if (!user) {
      next(new APIError('Not authorized, user not found', 401));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('⛔ JWT Verification failed:', error);
    next(new APIError('Not authorized, token failed verification', 401));
  }
}

// Optional Auth tracker for Guest path validation
export async function optionalProtect(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next();
    return;
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Fail silently for optional auth
    console.warn('⚠️ Optional JWT Verification bypassed:', error);
  }
  next();
}

// Grant access only to specific role configs (e.g., admin)
export function admin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new APIError('Not authorized as an administrator', 403));
  }
}
