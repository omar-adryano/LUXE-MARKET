import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'silicone cooking tools',
  'food storage containers',
  'facial massager roller',
  'eyelash curler',
  'makeup brush set',
  'hair removal device',
  'LED face mask',
  'resistance bands set',
  'posture corrector',
  'massage gun',
  'yoga mat',
  'ab roller wheel',
  'cable organizer',
  'desk organizer',
  'wall hooks adhesive',
  'shower organizer',
  'pet grooming brush',
  'cat toy interactive',
  'dog collar LED'
];

async function seedKeywords() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  let newlyImported = 0;

  for (const keyword of keywords) {
    try {
      console.log(`Searching for: ${keyword}`);
      const data = await CJDropshippingService.getProducts(keyword, 1);
      
      if (!data || !data.list || data.list.length === 0) {
        console.log(`No products found for ${keyword}`);
        continue;
      }

      let countForKeyword = 0;
      for (const item of data.list) {
        if (countForKeyword >= 2) break;

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) {
          continue;
        }

        try {
          // Add a short delay per individual import call
          await new Promise(resolve => setTimeout(resolve, 300));
          await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 30)}`);
          newlyImported++;
          countForKeyword++;
        } catch (err: any) {
          console.error(`Failed to import ${item.pid}: ${err.message}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err: any) {
       console.error(`Error searching keyword ${keyword}: ${err.message}`);
    }
  }

  console.log(`\nImport complete. Newly imported: ${newlyImported}`);
  const finalCount = await Product.countDocuments();
  console.log(`Total valid products in DB: ${finalCount}`);
  await mongoose.disconnect();
  process.exit(0);
}

seedKeywords();
