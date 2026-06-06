import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'Bluetooth speaker', 'smart led light', 'smart sensor', 'mini projector', 
  'usb gadget', 'wireless charger', 'smart desk', 'portable electronics'
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importGadgets() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  let newlyImported = 0;
  let targetImport = 20;

  for (const keyword of keywords) {
    if (newlyImported >= targetImport) break;
    
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
        if (newlyImported >= targetImport) break;
        if (countForKeyword >= 6) break; 

        // Skip non-gadgets based on CJ categories or keywords
        const cat = (item.categoryName || '').toLowerCase();
        if (cat.includes('clothing') || cat.includes('shoes') || cat.includes('jewelry') || 
            cat.includes('fashion') || cat.includes('beauty') || cat.includes('pet') || cat.includes('kitchen')) {
            console.log(`Skipped ${item.pid} due to category ${cat}`);
            continue;
        }

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) continue;

        try {
          await sleep(1500); 
          const product = await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          product.category = 'Smart Gadgets';
          
          if (!product.discount && product.originalPrice && product.originalPrice > product.price) {
            product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
          }

          await product.save();
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 30)}...`);
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

  console.log(`\nNewly imported: ${newlyImported}`);
  const finalCount = await Product.countDocuments({ category: 'Smart Gadgets' });
  console.log(`Final Smart Gadgets count: ${finalCount}`);
  process.exit(0);
}

importGadgets();
