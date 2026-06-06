import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'phone case',
  'magnetic phone case',
  'iphone case',
  'samsung case',
  'screen protector',
  'tempered glass',
  'phone holder',
  'car phone mount',
  'wireless charger',
  'magsafe charger',
  'charging cable',
  'usb-c cable',
  'fast charger',
  'power bank',
  'phone stand',
  'selfie stick',
  'mobile tripod',
  'camera lens kit',
  'bluetooth remote shutter',
  'phone cooling fan'
];

async function seedKeywords() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const beforeCount = await Product.countDocuments();
  console.log(`Initial product count: ${beforeCount}`);
  
  console.log('Starting phone accessories import...');
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
        if (countForKeyword >= 3) break; // 3 items per keyword to get around 60 total, reducing if already exists
        if (newlyImported >= 30) break; // Limit of 30 new imported items total, so at least 20

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) {
          // If it exists but is in a different category and we want it to be Phone Accessories
          if (existing.category !== 'Phone Accessories') {
            await Product.findByIdAndUpdate(existing._id, { category: 'Phone Accessories' });
          }
          continue;
        }

        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const prod = await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          await Product.findByIdAndUpdate(prod._id, { category: 'Phone Accessories' });
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 30)} as Phone Accessories`);
          newlyImported++;
          countForKeyword++;
        } catch (err: any) {
          console.error(`Failed to import ${item.pid}: ${err.message}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      if (newlyImported >= 25) break; 
    } catch (err: any) {
       console.error(`Error searching keyword ${keyword}: ${err.message}`);
    }
  }

  console.log(`\nImport complete. Newly imported Phone Accessories: ${newlyImported}`);
  const finalCount = await Product.countDocuments();
  console.log(`Final product count: ${finalCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

seedKeywords();
