import { Router } from 'express';
import { 
  getDashboardStats, 
  importDSersProduct, 
  syncDSersInventory, 
  syncDSersPrices, 
  syncDSersFulfillment 
} from '../controllers/adminController';
import { protect, admin } from '../middleware/auth';

const router = Router();

// Protect all admin dashboard routes with JWT and Admin checks
router.get('/dashboard-stats', protect, admin, getDashboardStats);

// DSers Integration routes
router.post('/dsers/import', protect, admin, importDSersProduct);
router.post('/dsers/sync-inventory', protect, admin, syncDSersInventory);
router.post('/dsers/sync-prices', protect, admin, syncDSersPrices);
router.post('/dsers/sync-fulfillment', protect, admin, syncDSersFulfillment);

export default router;
