import { Router } from 'express';
import {
  createReview,
  getProductReviews,
  deleteReview,
} from '../controllers/reviewController';
import { protect } from '../middleware/auth';
import { validateReview } from '../middleware/validation';

const router = Router();

router.post('/', protect, validateReview, createReview);
router.get('/product/:productId', getProductReviews);
router.delete('/:id', protect, deleteReview);

export default router;
