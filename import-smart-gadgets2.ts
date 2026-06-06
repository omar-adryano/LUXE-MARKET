import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'Bluetooth speaker', 'smart led', 'smart sensor', 'mini projector', 
  'smart home', 'wireless charger', 'usb gadget', 'electronic desk', 'portable mini'
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importGadgets() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const initialCount = await Product.countDocuments({ category: 'Smart Gadgets' });
  let newlyImported = 0;
  let targetToImport = 20 - initialCount;
  
  if (targetToImport <= 0) {
      console.log('Already have 20 gadgets.');
      process.exit(0);
  }

  console.log(`Need to import ${targetToImport} more products...`);

  const validKeywords = ['bluetooth', 'smart', 'wireless', 'usb', 'projector', 'led', 'charger', 'electronic', 'speaker', 'headphone', 'earphone', 'sensor', 'digital'];
  const invalidKeywords = ['shirt', 'pant', 'dress', 'shoe', 'jewelry', 'bracelet', 'necklace', 'pet', 'dog', 'cat', 'fashion', 'cardigan', 'blouse', 'apparel', 'sweater', 'skirt', 'boots', 'sandal'];

  for (const keyword of keywords) {
    if (newlyImported >= targetToImport) break;
    
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

      let countForKeyword = 0;
      for (const item of data.list) {
        if (newlyImported >= targetToImport) break;
        if (countForKeyword >= 4) break; 

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
          await sleep(2000); 
          const product = await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          product.category = 'Smart Gadgets';
          
          if (!product.discount && product.originalPrice && product.originalPrice > product.price) {
            product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
          }

          await product.save();
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 40)}`);
          newlyImported++;
          countForKeyword++;
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
