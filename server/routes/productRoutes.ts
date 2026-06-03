import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { protect, admin } from '../middleware/auth';
import { validateProduct } from '../middleware/validation';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, admin, validateProduct, createProduct);
router.put('/:id', protect, admin, validateProduct, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
