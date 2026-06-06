import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'smart led', 'mini projector', 'wireless charger', 'usb gadget', 'smart sensor', 'bluetooth speaker'
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importGadgets() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  let initialCount = await Product.countDocuments({ category: 'Smart Gadgets' });
  let newlyImported = 0;
  
  const invalidKeywords = ['shirt', 'pant', 'dress', 'shoe', 'jewelry', 'bracelet', 'necklace', 'pet', 'dog', 'cat', 'fashion', 'cardigan', 'blouse', 'apparel', 'sweater', 'skirt', 'boots', 'sandal', 'dispenser'];

  for (const keyword of keywords) {
    if (initialCount >= 20) break;
    
    console.log(`Searching for: ${keyword}`);
    await sleep(1000); 
    let data;
    try {
      data = await CJDropshippingService.getProducts(keyword, 1);
    } catch(e) {
      continue;
    }
    
    if (!data || !data.list) continue;

    for (const item of data.list) {
      initialCount = await Product.countDocuments({ category: 'Smart Gadgets' });
      if (initialCount >= 20) break;

      const nameStr = (item.productNameEn || '').toLowerCase();
      
      let hasInvalid = false;
      for (const ivk of invalidKeywords) {
          if (nameStr.includes(ivk)) { hasInvalid = true; break; }
      }
      if (hasInvalid) continue;

      const existing = await Product.findOne({ aliexpressProductId: item.pid });
      if (existing) continue;

      try {
        await sleep(500); 
        const product = await CJDropshippingService.importProductToDB(item.pid, item.productImage);
        product.category = 'Smart Gadgets';
        
        if (!product.discount && product.originalPrice && product.originalPrice > product.price) {
          product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        }

        await product.save();
        console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 40)}`);
        initialCount++;
      } catch (err: any) {
           console.log(`Skipped ${item.pid}: ${err.message}`);
      }
    }
  }

  const finalCount = await Product.countDocuments({ category: 'Smart Gadgets' });
  console.log(`Final count: ${finalCount}`);
  process.exit(0);
}

importGadgets();
