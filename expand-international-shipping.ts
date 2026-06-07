
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.ts';
import { ShippingCache } from './server/models/ShippingCache.ts';
import { CJShippingService } from './server/services/cjShippingService.ts';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to target DB. Starting background generation...');
  
  const targetCountries = ['GB', 'DE', 'CA', 'FR', 'AU', 'AE', 'SA', 'SG'];
  const products = await Product.find({ source: 'cj', isPublished: true, vid: { $exists: true, $ne: '' } });
  
  let recordsGenerated = 0;
  let failedRecords = 0;
  
  for (const product of products) {
    for (const country of targetCountries) {
      if (!product.vid) continue;
      
      const exists = await ShippingCache.exists({ vid: product.vid, countryCode: country });
      if (exists) continue; // Skip redundant updates
      
      try {
        const cost = await CJShippingService.updateCacheForVariant(product.vid, country);
        if (cost !== null) {
          recordsGenerated++;
          console.log(`[SYNC] ${product.vid} | ${country} | $${cost}`);
        } else {
          failedRecords++;
          console.log(`[FAILED] ${product.vid} | ${country} | No options`);
        }
      } catch (e: any) {
        failedRecords++;
        console.log(`[ERROR] ${product.vid} | ${country} | ${e.message}`);
      }
      
      // Crucial: Rate limit safety delay
      await delay(1100);
    }
  }
  
  console.log('--- COMPLETED ---');
  console.log('Generated:', recordsGenerated);
  console.log('Failures / Fallbacks:', failedRecords);
  process.exit(0);
}

run().catch(console.error);
