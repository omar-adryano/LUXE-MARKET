import cron from 'node-cron';
import { Product } from '../models/Product';
import { CJShippingService } from '../services/cjShippingService';

export const startShippingSyncJob = () => {
  // Run once per day at 1:00 AM server time
  cron.schedule('0 1 * * *', async () => {
    console.log('[ShippingSyncJob] Starting nightly CJ shipping cost sync...');
    const topCountries = ['US', 'UK', 'CA', 'AU'];

    try {
      // Find CJ products that have a vid
      const cjProducts = await Product.find({ source: 'cj', vid: { $exists: true, $ne: '' } });
      
      console.log(`[ShippingSyncJob] Found ${cjProducts.length} CJ products with VIDs.`);

      let successCount = 0;
      let failCount = 0;

      for (const product of cjProducts) {
        if (!product.vid) continue;
        
        for (const countryCode of topCountries) {
          try {
            const cost = await CJShippingService.updateCacheForVariant(product.vid, countryCode);
            if (cost !== null) {
               successCount++;
            } else {
               failCount++;
            }
          } catch (err: any) {
             console.error(`[ShippingSyncJob] Failed for vid ${product.vid} country ${countryCode}: ${err.message}`);
             failCount++;
          }
        }
      }

      console.log(`[ShippingSyncJob] Sync complete. Success: ${successCount}, Fail: ${failCount}.`);
    } catch (err: any) {
      console.error('[ShippingSyncJob] Failed to run sync job:', err.message);
    }
  });

  console.log('[ShippingSyncJob] Nightly shipping sync job initialized.');
};
