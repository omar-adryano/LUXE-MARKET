import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
import { CJDropshippingService } from './server/services/aliexpressService';

dotenv.config();

async function repair() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    
    // Process only ones without vid
    const products = await Product.find({ source: 'cj', vid: { $in: [null, '', 'NO_VID', 'ERR_VID'] } });
    
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
         } else {
            p.vid = 'NO_VID_FOUND';
            await p.save();
         }
      } catch(err:any) {
         p.vid = 'API_ERROR_BG';
         await p.save();
      }
      // Wait 1200ms between calls!
      await new Promise(res => setTimeout(res, 1200));
    }
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}
repair();
