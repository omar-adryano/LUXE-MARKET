import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'toys', 'men fashion', 'women fashion', 'sports', 'jewelry', 'shoes'
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
      if (currentTotal >= 150) {
          console.log('Reached 150 products.');
          break;
      }

      console.log(`Searching for: ${keyword}`);
      await sleep(1500); // Respect QPS 1/sec
      let data;
      try {
        data = await CJDropshippingService.getProducts(keyword, 1);
      } catch(e) {
        await sleep(2000);
        continue;
      }
      
      if (!data || !data.list || data.list.length === 0) continue;

      let countForKeyword = 0;
      for (const item of data.list) {
        if (countForKeyword >= 8) break;

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) continue;

        try {
          await sleep(1500); // Respect QPS 1/sec for info API
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
