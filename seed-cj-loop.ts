import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'smart watch', 'ring light', 'power bank', 'phone holder', 'smart plug',
  'desk organizer', 'travel neck pillow', 'water bottle', 'yoga mat',
  'makeup brush', 'resistance bands', 'massage gun'
];

async function seedKeywords() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  let newlyImported = 0;

  for (const keyword of keywords) {
    try {
      const currentTotal = await Product.countDocuments();
      if (currentTotal > 175) {
          console.log('Reached more than 175 products, stopping import.');
          break;
      }

      console.log(`Searching for: ${keyword}`);
      const data = await CJDropshippingService.getProducts(keyword, 1);
      
      if (!data || !data.list || data.list.length === 0) continue;

      let countForKeyword = 0;
      for (const item of data.list) {
        if (countForKeyword >= 5) break;

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) continue;

        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 30)}`);
          newlyImported++;
          countForKeyword++;
        } catch (err: any) {
          console.error(`Failed to import ${item.pid}: ${err.message}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: any) {
       console.error(`Error searching ${keyword}: ${err.message}`);
    }
  }

  process.exit(0);
}

seedKeywords();
