import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'electronics', 'home decor', 'kitchen tools', 'makeup', 'fitness tracker'
];

async function seedKeywords() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  let newlyImported = 0;

  for (const keyword of keywords) {
    try {
      console.log(`Searching for: ${keyword}`);
      const data = await CJDropshippingService.getProducts(keyword, 1);
      
      if (!data || !data.list || data.list.length === 0) continue;

      let countForKeyword = 0;
      for (const item of data.list) {
        if (countForKeyword >= 10) break;

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) {
          countForKeyword++;
          continue;
        }

        try {
          await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 30)}`);
          newlyImported++;
          countForKeyword++;
        } catch (err: any) {
          console.error(`Failed to import ${item.pid}: ${err.message}`);
        }
      }
    } catch (err: any) {
       console.error(`Error searching ${keyword}: ${err.message}`);
    }
  }

  console.log(`Newly imported: ${newlyImported}`);
  const finalCount = await Product.countDocuments();
  console.log(`Total valid products: ${finalCount}`);
  process.exit(0);
}

seedKeywords();
