import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
import { CJDropshippingService } from './server/services/aliexpressService';

dotenv.config();

async function repair() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    
    // Process only ones without vid
    const products = await Product.find({ source: 'cj', vid: { $in: [null, ''] } });
    console.log(`Found ${products.length} CJ products missing vid`);
    
    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const p of products) {
      if (!p.aliexpressProductId) {
         skippedCount++;
         continue;
      }
      try {
         const info = await CJDropshippingService.getProductInfo(p.aliexpressProductId);
         if (!info) {
            failedCount++;
            continue;
         }
         let vid = null;
         let weight = null;
         if (info.variants && info.variants.length > 0) {
            vid = info.variants[0].vid || info.variants[0].variantId;
            weight = info.variants[0].variantWeight || info.variants[0].weight;
         }
         if (!vid) vid = info.vid || info.id;
         if (!weight) weight = info.productWeight || info.weight;

         if (vid) {
            p.vid = vid;
            if (weight) p.weight = Number(weight);
            await p.save();
            updatedCount++;
            console.log(`Updated: ${p.name} -> ${vid}`);
         } else {
            p.vid = 'NO_VID_FOUND';
            await p.save();
            failedCount++;
         }
      } catch(err:any) {
         p.vid = 'API_ERROR_BG';
         await p.save();
         failedCount++;
      }
      // Wait 1200ms between calls!
      await new Promise(res => setTimeout(res, 1200));
    }
    console.log(`Finished processing. Updated: ${updatedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
    
    // Reaudit
    const total = await Product.countDocuments();
    const withVid = await Product.countDocuments({ vid: { $nin: [null, '', 'NO_VID_FOUND', 'API_ERROR_BG'] } });
    const missingVid = await Product.countDocuments({ vid: { $in: [null, ''] } });
    
    console.log(`\n--- FINAL AUDIT ---`);
    console.log(`Total products: ${total}`);
    console.log(`Products with VID: ${withVid}`);
    console.log(`Products missing VID: ${missingVid}`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
repair();
