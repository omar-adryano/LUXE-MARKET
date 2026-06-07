import { Router } from 'express';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import orderRoutes from './orderRoutes';
import reviewRoutes from './reviewRoutes';
import wishlistRoutes from './wishlistRoutes';
import paypalRoutes from './paypalRoutes';
import adminRoutes from './adminRoutes';
import aliexpressRoutes from './aliexpressRoutes';

const apiRouter = Router();

apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/paypal', paypalRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/aliexpress', aliexpressRoutes);

// Shipping cost calculation route
import { ShippingCache } from '../models/ShippingCache';
import { Product } from '../models/Product';
apiRouter.post('/shipping/calculate', async (req, res) => {
  console.log('--- RECEIVED SHIPPING CALCULATE ---');
  console.log('Body:', req.body);
  try {
    const { items, countryCode } = req.body;
    let totalShipping = 0;
    
    // Country code fallback logic
    const cc = countryCode || 'US';

    for (const item of items) {
      if (!item.product) continue;
      const product = await Product.findById(item.product);
      if (!product || product.source !== 'cj' || !product.vid) {
         // Fallback for non-CJ or missing vid
         totalShipping += 4.99 * item.quantity;
         continue;
      }

      const cache = await ShippingCache.findOne({ vid: product.vid, countryCode: cc });
      if (cache && cache.shippingCost !== undefined) {
         totalShipping += cache.shippingCost * item.quantity;
      } else {
         totalShipping += 4.99 * item.quantity;
      }
    }

    res.json({ shippingCost: totalShipping });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.get('/shipping/admin-cache', async (req, res) => {
  try {
     const vid = req.query.vid as string;
     if (!vid) return res.status(400).json({ error: 'Missing vid' });
     
     // just fetch US cache for admin visibility
     const cache = await ShippingCache.findOne({ vid, countryCode: 'US' });
     res.json({ cache });
  } catch(e: any) {
     res.status(500).json({ error: e.message });
  }
});

apiRouter.get('/shipping/all-caches', async (req, res) => {
  try {
     const caches = await ShippingCache.find({});
     res.json({ success: true, caches });
  } catch(e: any) {
     res.status(500).json({ error: e.message });
  }
});

import { CJShippingService } from '../services/cjShippingService';
apiRouter.post('/shipping/sync-variant', async (req, res) => {
  try {
      const { vid, countryCode } = req.body;
      if (!vid || !countryCode) {
          return res.status(400).json({ success: false, error: 'Missing vid or countryCode' });
      }

      const cost = await CJShippingService.updateCacheForVariant(vid, countryCode);
      if (cost !== null) {
          return res.json({ success: true, cost });
      } else {
          return res.status(500).json({ success: false, error: 'API failed or no options available' });
      }
  } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
  }
});

export default apiRouter;
