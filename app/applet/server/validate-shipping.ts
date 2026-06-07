import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './models/Product.ts';
import { Category } from './models/Category.ts';
import { ShippingCache } from './models/ShippingCache.ts';
import { CJShippingService } from './services/cjShippingService.ts';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');
  
  const targetCountries = ['US', 'GB', 'DE', 'CA', 'FR', 'AU', 'AE', 'SA', 'SG'];
  const categories = await Category.find({ name: { $in: ['Furniture', 'Home Decor', 'Electronics'] } });
  
  const cacheResults: any[] = [];

  for (const cat of categories) {
    const product = await Product.findOne({ category: cat.name, source: 'cj', isPublished: true, vid: { $exists: true, $ne: '' } });
    if (!product) continue;
    
    console.log(`Processing sample product from ${cat.name} (VID: ${product.vid})...`);
    
    for (const country of targetCountries) {
        let cache = await ShippingCache.findOne({ vid: product.vid, countryCode: country });
        if (!cache && country !== 'US') {
            await CJShippingService.updateCacheForVariant(product.vid, country);
            cache = await ShippingCache.findOne({ vid: product.vid, countryCode: country });
            await delay(1100);
        }
        
        if (cache) {
            cacheResults.push({
                Category: cat.name,
                VID: product.vid,
                Country: country,
                'Shipping Cost': cache.shippingCost,
                'Logistics Method': cache.logisticsName,
                'Estimated Days': cache.estimatedDays
            });
        }
    }
  }
  
  console.log('Validation Report:');
  console.table(cacheResults);

  process.exit(0);
}

run().catch(console.error);
