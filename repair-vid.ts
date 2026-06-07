import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
import { CJDropshippingService } from './server/services/aliexpressService';

dotenv.config();

async function repair() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    
    // Process only ones without vid
    const products = await Product.find({ source: 'cj', vid: { $in: [null, ''] } }).limit(40);
    console.log(`Found ${products.length} CJ products missing vid in this batch`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

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
        } else {
           failedCount++;
        }
        
        // Sleep to avoid rate limit (1 req/s)
        await new Promise(res => setTimeout(res, 1100));
      } catch (err: any) {
        failedCount++;
        await new Promise(res => setTimeout(res, 1100));
      }
    }

    console.log(`Updated: ${updatedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
    
    // Check remaining total
    const remaining = await Product.countDocuments({ source: 'cj', vid: { $in: [null, ''] }, aliexpressProductId: { $exists: true, $ne: '' } });
    console.log(`Remaining missing VID: ${remaining}`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

repair();
