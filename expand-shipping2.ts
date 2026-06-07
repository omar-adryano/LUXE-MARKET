
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.ts';
import { ShippingCache } from './server/models/ShippingCache.ts';
import { CJShippingService } from './server/services/cjShippingService.ts';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');
  
  const targetCountries = ['GB', 'DE', 'CA', 'FR', 'AU', 'AE', 'SA', 'SG'];
  const products = await Product.find({ source: 'cj', isPublished: true, vid: { $exists: true, $ne: '' } });
  
  console.log('Eligible CJ Products: ' + products.length);
  
  let recordsGenerated = 0;
  let failedRecords = 0;
  let attempts = 0;
  
  const limit = process.argv[2] ? parseInt(process.argv[2]) : products.length;
  const productsToProcess = products.slice(0, limit);
  
  console.log('Processing ' + productsToProcess.length + ' products...');
  
  for (const product of productsToProcess) {
    for (const country of targetCountries) {
      if (!product.vid) continue;
      
      const exists = await ShippingCache.exists({ vid: product.vid, countryCode: country });
      if (exists) {
        continue;
      }
      
      try {
        const cost = await CJShippingService.updateCacheForVariant(product.vid, country);
        if (cost !== null) {
          recordsGenerated++;
          console.log('[SYNC] VID: ' + product.vid + ' | Country: ' + country + ' | Cost: $' + cost);
        } else {
          failedRecords++;
          console.log('[SYNC] VID: ' + product.vid + ' | Country: ' + country + ' | Failed (No options available)');
        }
      } catch (e: any) {
        failedRecords++;
        console.log('[ERROR] VID: ' + product.vid + ' | Country: ' + country + ' | Message: ' + e.message);
      }
      
      attempts++;
      await delay(1100);
    }
  }
  
  const totalCaches = await ShippingCache.countDocuments();
  const coveragePercent = ((totalCaches / (products.length * targetCountries.length)) * 100).toFixed(2);
  
  console.log('
==================================================');
  console.log('FINAL REPORT');
  console.log('==================================================');
  console.log('1. Total records generated: ' + recordsGenerated);
  console.log('2. Failed records: ' + failedRecords);
  console.log('3. Runtime estimate for all ' + products.length + ' products: ~' + ((products.length * targetCountries.length * 1.1) / 60).toFixed(2) + ' minutes');
  console.log('4. Countries completed: ' + targetCountries.join(', '));
  console.log('5. Cache coverage percentage: ' + coveragePercent + '%');
  
  process.exit(0);
}

run().catch(console.error);
