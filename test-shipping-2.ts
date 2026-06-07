
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.ts';
import { ShippingCache } from './server/models/ShippingCache.ts';
import { CJShippingService } from './server/services/cjShippingService.ts';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const targetCountries = ['US', 'GB', 'DE', 'CA', 'FR', 'AU', 'AE', 'SA', 'SG'];
  const cats = ['Home & Kitchen', 'Electronics', 'Smart Gadgets'];
  const cacheResults: any[] = [];

  for (const cat of cats) {
    const product = await Product.findOne({ category: cat, source: 'cj', vid: { $exists: true, $ne: '' } });
    if (!product) continue;
    
    for (const country of targetCountries) {
        let cache = await ShippingCache.findOne({ vid: product.vid, countryCode: country });
        if (!cache && country !== 'US') {
            await CJShippingService.updateCacheForVariant(product.vid, country);
            cache = await ShippingCache.findOne({ vid: product.vid, countryCode: country });
            await delay(1100);
        }
        
        if (cache) {
            cacheResults.push({
                Category: cat,
                VID: product.vid,
                Country: country,
                Cost: cache.shippingCost,
                Method: cache.logisticsName,
                Days: cache.estimatedDays
            });
        }
    }
  }
  
  console.table(cacheResults);

  process.exit(0);
}

run().catch(console.error);
