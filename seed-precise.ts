import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'usb hub', 'gaming headset', 'coffee mug', 'backpack', 'sunglasses'
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

      console.log('Fetching', keyword);
      // Wait 1.1s to respect 1 req/s
      await sleep(1100);
      const data = await CJDropshippingService.getProducts(keyword, 1);
      if (!data || !data.list || data.list.length === 0) continue;

      let countForKeyword = 0;
      for (const item of data.list) {
        if (countForKeyword >= 10) break;

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) continue;

        try {
          await sleep(1100); // Wait 1.1s for the info API
          await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 30)}`);
          newlyImported++;
          countForKeyword++;
        } catch (err: any) {
          console.log('Ignore error:', err.message);
        }
      }
    } catch (err: any) {
      console.log('Ignore error:', err.message);
    }
  }

  const finalTotal = await Product.countDocuments();
  console.log('Total valid products:', finalTotal);
  process.exit(0);
}

seedKeywords();
