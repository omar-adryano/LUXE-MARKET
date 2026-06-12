import { CJDropshippingService } from './server/services/aliexpressService';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { Product } from './server/models/Product';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  
  const prods = await Product.find({ source: 'cj' }).limit(10);
  console.log(`Found ${prods.length} products to backfill variants`);
  
  for (const p of prods) {
    if (!p.aliexpressProductId) continue;
    try {
      const info = await CJDropshippingService.getProductInfo(p.aliexpressProductId);
      if (info.variants) {
         p.cjVariants = info.variants;
         await p.save();
         console.log(`Backfilled variants for ${p.name}`);
      }
    } catch (e) {
      console.log('Error', p.aliexpressProductId, e.message);
    }
    await delay(1200);
  }
  process.exit();
}
run();
