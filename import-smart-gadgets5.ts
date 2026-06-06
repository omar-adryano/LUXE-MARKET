import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

async function importGadgets() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  // CLEANUP all garbage
  const allGadgets = await Product.find({ category: 'Smart Gadgets' });
  for (const g of allGadgets) {
      const n = (g.name || "").toLowerCase();
      // Keep ONLY if we are sure it is an electronics / smart gadget
      const isGadget = ['smart', 'phone', 'led', 'record', 'frother', 'projector', 'charger', 'watch', 'clock', 'speaker', 'headphone', 'usb', 'bluetooth'].some(k => n.includes(k));
      if (!isGadget) {
          console.log(`Deleting non-gadget: ${g.name}`);
          await Product.deleteOne({_id: g._id});
      }
  }

  let count = await Product.countDocuments({ category: 'Smart Gadgets' });
  console.log(`Currently have ${count} real gadgets.`);

  let pageNum = 1;
  const targetToImport = 20;

  while(count < targetToImport && pageNum < 20) {
    if (count >= targetToImport) break;
    
    console.log(`Fetching page ${pageNum}...`);
    let data;
    try {
      data = await CJDropshippingService.getProducts('', pageNum);
    } catch(e) {
      pageNum++;
      continue;
    }
    
    if (!data || !data.list) break;

    for (const item of data.list) {
      count = await Product.countDocuments({ category: 'Smart Gadgets' });
      if (count >= targetToImport) break;

      const nameStr = (item.productNameEn || '').toLowerCase();
      
      const validKeywords = ['bluetooth', 'smart', 'wireless', 'usb', 'projector', 'led', 'charger', 'electronic', 'speaker', 'headphone', 'earphone', 'sensor', 'digital', 'plug', 'humidifier', 'clock', 'watch', 'light', 'bank', 'hub'];
      let hasValid = false;
      for (const vk of validKeywords) {
          if (nameStr.includes(vk)) { hasValid = true; break; }
      }
      if (!hasValid) continue;

      const invalidKeywords = ['shirt', 'pant', 'dress', 'shoe', 'jewelry', 'bracelet', 'necklace', 'pet', 'dog', 'cat', 'fashion', 'cardigan', 'blouse', 'apparel', 'sweater', 'skirt', 'boots', 'sandal', 'dispenser'];
      let hasInvalid = false;
      for (const ivk of invalidKeywords) {
          if (nameStr.includes(ivk)) { hasInvalid = true; break; }
      }
      if (hasInvalid) continue;

      const existing = await Product.findOne({ aliexpressProductId: item.pid });
      if (existing) continue;

      try {
        const product = await CJDropshippingService.importProductToDB(item.pid, item.productImage);
        product.category = 'Smart Gadgets';
        
        if (!product.discount && product.originalPrice && product.originalPrice > product.price) {
          product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        }

        await product.save();
        console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 40)}`);
        count++;
      } catch (err: any) {
           // ignore
      }
    }
    pageNum++;
  }

  const finalCount = await Product.countDocuments({ category: 'Smart Gadgets' });
  console.log(`Final count: ${finalCount}`);
  process.exit(0);
}

importGadgets();
