import { Router } from 'express';
import { 
  getDashboardStats, 
  importAliExpressProduct, 
  syncAliExpressInventory, 
  syncAliExpressPrices, 
  syncAliExpressFulfillment,
  searchCJProducts,
  importCJProduct
} from '../controllers/adminController';
import { protect, admin } from '../middleware/auth';

const router = Router();

// Protect all admin dashboard routes with JWT and Admin checks
router.get('/dashboard-stats', protect, admin, getDashboardStats);

// AliExpress Integration Architecture routes
router.get('/cj/search', protect, admin, searchCJProducts);
router.post('/cj/import', protect, admin, importCJProduct);
router.post('/aliexpress/import', protect, admin, importAliExpressProduct);
router.post('/aliexpress/sync-inventory', protect, admin, syncAliExpressInventory);
router.post('/aliexpress/sync-prices', protect, admin, syncAliExpressPrices);
router.post('/aliexpress/sync-fulfillment', protect, admin, syncAliExpressFulfillment);

export default router;
