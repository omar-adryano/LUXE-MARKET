import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController';
import { protect, admin, optionalProtect } from '../middleware/auth';
import { validateOrder } from '../middleware/validation';

const router = Router();

router.post('/', optionalProtect, validateOrder, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;
