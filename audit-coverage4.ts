
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.ts';
import { CJShippingService } from './server/services/cjShippingService.ts';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');
  
  const targetCountries = ['AE', 'SA', 'SG'];
  const products = await Product.find({ source: 'cj', isPublished: true, vid: { $exists: true, $ne: '' } }).limit(4);
  
  const results: any = {};
  targetCountries.forEach(c => results[c] = { Supported: 0, Unsupported: 0 });

  for (const product of products) {
    for (const country of targetCountries) {
      if (!product.vid) continue;
      
      try {
        const options = await CJShippingService.calculateFreight(product.vid, country, 1);
        if (options && options.length > 0) {
          results[country].Supported++;
        } else {
          results[country].Unsupported++;
        }
      } catch (e: any) {
        results[country].Unsupported++;
      }
      await delay(1200);
    }
  }
  
  for (const c of targetCountries) {
    const total = results[c].Supported + results[c].Unsupported;
    results[c].Coverage = total > 0 ? Math.round((results[c].Supported / total) * 100) + '%' : '0%';
  }
  
  console.table(results);
  process.exit(0);
}

run().catch(console.error);
