import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'charger', 'wireless', 'watch', 'clock', 'smart plug', 'led strip', 
  'humidifier', 'bluetooth', 'speaker', 'power bank', 'sensor', 'projector',
  'desk light', 'hub', 'smart lock'
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importGadgets() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  let initialCount = await Product.countDocuments({ category: 'Smart Gadgets' });
  let newlyImported = 0;
  
  if (initialCount >= 20) {
      console.log('Already have 20 gadgets.');
      process.exit(0);
  }

  const validKeywords = ['bluetooth', 'smart', 'wireless', 'usb', 'projector', 'led', 'charger', 'electronic', 'speaker', 'headphone', 'earphone', 'sensor', 'digital', 'plug', 'humidifier', 'clock', 'watch', 'light', 'bank', 'hub'];
  const invalidKeywords = ['shirt', 'pant', 'dress', 'shoe', 'jewelry', 'bracelet', 'necklace', 'pet', 'dog', 'cat', 'fashion', 'cardigan', 'blouse', 'apparel', 'sweater', 'skirt', 'boots', 'sandal', 'dispenser'];

  for (const keyword of keywords) {
    initialCount = await Product.countDocuments({ category: 'Smart Gadgets' });
    if (initialCount >= 20) break;
    
    try {
      console.log(`Searching for: ${keyword}`);
      await sleep(1500); 
      let data;
      try {
        data = await CJDropshippingService.getProducts(keyword, 1);
      } catch(e) {
        await sleep(2000);
        continue;
      }
      
      if (!data || !data.list || data.list.length === 0) continue;

      for (const item of data.list) {
        initialCount = await Product.countDocuments({ category: 'Smart Gadgets' });
        if (initialCount >= 20) break;

        const nameStr = (item.productNameEn || '').toLowerCase();
        
        let hasValid = false;
        for (const vk of validKeywords) {
            if (nameStr.includes(vk)) { hasValid = true; break; }
        }
        if (!hasValid) continue;

        let hasInvalid = false;
        for (const ivk of invalidKeywords) {
            if (nameStr.includes(ivk)) { hasInvalid = true; break; }
        }
        if (hasInvalid) continue;

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) continue;

        try {
          await sleep(1000); 
          const product = await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          product.category = 'Smart Gadgets';
          
          if (!product.discount && product.originalPrice && product.originalPrice > product.price) {
            product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
          }

          await product.save();
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 40)}`);
          newlyImported++;
        } catch (err: any) {
             console.log(`Skipped ${item.pid}: ${err.message}`);
        }
      }
    } catch (err: any) {
         console.error(`Error searching ${keyword}: ${err.message}`);
    }
  }

  const finalCount = await Product.countDocuments({ category: 'Smart Gadgets' });
  console.log(`Final Smart Gadgets count: ${finalCount}`);
  process.exit(0);
}

importGadgets();
