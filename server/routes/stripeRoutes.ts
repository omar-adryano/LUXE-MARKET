import { Router } from 'express';
import {
  createCheckoutSession,
  verifyCheckoutSession,
  getStripeConfig,
} from '../controllers/stripeController';
import { optionalProtect } from '../middleware/auth';

const router = Router();

router.get('/config', getStripeConfig);
router.post('/create-checkout-session', optionalProtect, createCheckoutSession);
router.post('/verify-session', verifyCheckoutSession);

export default router;
