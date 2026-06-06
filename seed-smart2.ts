import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'dog', 'cat', 'water bottle', 'fitness tracker', 'sneakers', 'yoga mat', 'decor'
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedKeywords() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  let newlyImported = 0;

  for (const keyword of keywords) {
    try {
      const currentTotal = await Product.countDocuments();
      if (currentTotal > 155) {
          console.log('Reached more than 150 products.');
          break;
      }

      await sleep(1000);
      const data = await CJDropshippingService.getProducts(keyword, 1);
      if (!data || !data.list || data.list.length === 0) continue;

      let countForKeyword = 0;
      for (const item of data.list) {
        if (countForKeyword >= 10) break;

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) continue;

        try {
          await sleep(1500); 
          await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          newlyImported++;
          countForKeyword++;
        } catch (err: any) {
        }
      }
    } catch (err: any) {
    }
  }

  process.exit(0);
}

seedKeywords();
