import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
import { CJDropshippingService } from './server/services/aliexpressService';

dotenv.config();

async function repair() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    
    const products = await Product.find({ source: 'cj', vid: { $in: [null, ''] } });
    console.log(`Found ${products.length} CJ products missing vid`);
    
    let updatedCount = 0;
    
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (p) => {
          if (!p.aliexpressProductId) return;
          try {
             const info = await CJDropshippingService.getProductInfo(p.aliexpressProductId);
             if(!info) return;
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
                p.vid = 'NO_VID_FOUND';
                await p.save();
             }
          } catch(err) {
             // mark as error so we don't retry in this script
             p.vid = 'RATE_LIMIT_OR_ERROR';
             await p.save();
          }
      }));
      // Wait 1.5s between batches
      await new Promise(res => setTimeout(res, 1500));
    }

    console.log(`Updated: ${updatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
repair();
