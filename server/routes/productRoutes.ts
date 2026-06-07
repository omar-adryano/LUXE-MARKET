import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  syncProduct,
  recalculatePrices,
  resetPricing
} from '../controllers/productController';
import { protect, admin } from '../middleware/auth';
import { validateProduct } from '../middleware/validation';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, admin, validateProduct, createProduct);
router.put('/:id', protect, admin, validateProduct, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

// New CJ automation specific individual bulk action endpoints
router.post('/:id/sync', protect, admin, syncProduct);
router.post('/:id/recalculate-prices', protect, admin, recalculatePrices);
router.post('/:id/reset-pricing', protect, admin, resetPricing);

export default router;
