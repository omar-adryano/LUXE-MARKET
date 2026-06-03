import { Router } from 'express';
import {
  getWishlist,
  toggleWishlistItem,
} from '../controllers/wishlistController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getWishlist);
router.post('/toggle', protect, toggleWishlistItem);

export default router;
