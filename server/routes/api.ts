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
import { CJShippingService } from '../services/cjShippingService';

apiRouter.post('/shipping/calculate-single', async (req, res) => {
  console.log('--- RECEIVED SHIPPING CALCULATE SINGLE ---');
  console.log('Body:', req.body);
  try {
    const { vid, countryCode, quantity, weight } = req.body;
    let shippingCost = 4.99 * quantity;
    let estimatedDays = '7-15';
    let logisticName = 'Standard';

    const cc = countryCode || 'US';

    if (vid) {
      // Fetch dynamic price from CJ
      const options = await CJShippingService.calculateFreight(vid, cc, quantity);
      if (options && options.length > 0) {
        // Find the best standard option or just use the first available
        const bestOption = options[0];
        if (bestOption) {
           shippingCost = typeof bestOption.logisticPrice === 'number' ? bestOption.logisticPrice : Number(bestOption.logisticPrice || 0);
           estimatedDays = bestOption.logisticAging || '7-15';
           logisticName = bestOption.logisticName || 'Standard';
        }
      } else {
        // Fallback: Check if we have standard cached, then apply custom weight-based fallback formula 
        // to avoid simple linear cached_shipping * quantity if CJ fails.
        const cache = await ShippingCache.findOne({ vid, countryCode: cc });
        if (cache && cache.shippingCost !== undefined) {
          // If weight is provided, do a rough logistic scaling instead of linear multiplication
          if (weight && weight > 0) {
            // Assume the cache.shippingCost is for 1 item (weight = W).
            // A common fallback scale is Base Cost + (Total Weight - Base Weight) * Rate
            // For simplicity, if we don't know the rate, we just fallback to CJ API's response.
            // If CJ API fails, unfortunately we have to estimate. Let's do a sub-linear scaling:
            shippingCost = cache.shippingCost + (cache.shippingCost * 0.5 * (quantity - 1)); 
          } else {
            shippingCost = cache.shippingCost * quantity; 
          }
          estimatedDays = cache.estimatedDays || '7-15';
          logisticName = cache.logisticsName || 'Standard';
        }
      }
    }

    res.json({ shippingCost, estimatedDays, logisticName });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});
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
