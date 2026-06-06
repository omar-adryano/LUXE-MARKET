import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'Bluetooth speaker', 'smart led light', 'mini projector', 
  'usb gadget', 'wireless charger', 'smart desk', 'portable electronics', 'humidifier', 'smart plug'
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importGadgets() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  // CLEANUP all garbage
  const allGadgets = await Product.find({ category: 'Smart Gadgets' });
  for (const g of allGadgets) {
      const n = (g.name || "").toLowerCase();
      const isGadget = ['smart', 'phone', 'led', 'record', 'frother', 'projector', 'charger', 'watch', 'clock', 'speaker', 'headphone', 'usb', 'bluetooth', 'light'].some(k => n.includes(k));
      if (!isGadget) {
          console.log(`Deleting non-gadget: ${g.name}`);
          await Product.deleteOne({_id: g._id});
      }
  }

  let count = await Product.countDocuments({ category: 'Smart Gadgets' });
  console.log(`Currently have ${count} real gadgets.`);

  const targetToImport = 20;

  for (const keyword of keywords) {
    if (count >= targetToImport) break;
    
    console.log(`Searching for: ${keyword}`);
    let data;
    try {
      data = await CJDropshippingService.getProducts(keyword, 1);
    } catch(e) {
      continue;
    }
    
    if (!data || !data.list) continue;

    for (const item of data.list) {
      count = await Product.countDocuments({ category: 'Smart Gadgets' });
      if (count >= targetToImport) break;

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
        count++;
      } catch (err: any) {
           // ignore
      }
    }
  }

  const finalCount = await Product.countDocuments({ category: 'Smart Gadgets' });
  console.log(`Final count: ${finalCount}`);
  process.exit(0);
}

importGadgets();
