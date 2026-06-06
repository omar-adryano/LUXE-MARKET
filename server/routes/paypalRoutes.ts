import { Router } from 'express';
import {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalConfig,
} from '../controllers/paypalController';
import { optionalProtect } from '../middleware/auth';

const router = Router();

router.get('/config', getPayPalConfig);
router.post('/create-order', optionalProtect, createPayPalOrder);
router.post('/capture-order', capturePayPalOrder);

export default router;
