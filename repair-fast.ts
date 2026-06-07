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
    
    for (const p of products) {
      if (!p.aliexpressProductId) continue;
      try {
         const info = await CJDropshippingService.getProductInfo(p.aliexpressProductId);
         if (!info) continue;
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
         } else {
            p.vid = 'NO_VID';
            await p.save();
         }
      } catch(err:any) {
         if (err.message && err.message.includes('Too Many Requests')) {
             process.stdout.write('T');
             // we got rate limited, try again after longer wait? No, just skip and we'll rerun
         } else {
             p.vid = 'ERR_VID';
             await p.save();
         }
      }
      // Wait 150ms between calls!
      await new Promise(res => setTimeout(res, 150));
    }

    console.log(`\nUpdated: ${updatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
repair();
