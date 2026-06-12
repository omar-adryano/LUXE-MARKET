import { CJDropshippingService } from './server/services/aliexpressService';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const prods = await db.collection('products').find({ source: 'cj' }).limit(50).toArray();
  let productsWithVariantImages = 0;
  let productsWithoutVariantImages = 0;
  let totalVariantsChecked = 0;
  let variantsWithImages = 0;
  const imageFields = new Set<string>();

  for (const p of prods) {
    if (!p.aliexpressProductId) continue;
    try {
      const info = await CJDropshippingService.getProductInfo(p.aliexpressProductId);
      let pHasVariantImg = false;
      if (info.variants && Array.isArray(info.variants)) {
        for (const v of info.variants) {
          totalVariantsChecked++;
          for (const k of Object.keys(v)) {
            if (k.toLowerCase().includes('image') || k.toLowerCase().includes('pic') || k.toLowerCase().includes('url')) {
              imageFields.add(k);
            }
          }
          if (v.variantImage) {
            pHasVariantImg = true;
            variantsWithImages++;
          }
        }
      }
      if (pHasVariantImg) productsWithVariantImages++;
      else productsWithoutVariantImages++;

      await delay(1005);
    } catch (e) {
      console.error(e);
    }
  }

  const report = `==================================================
Variant Image Sync Audit Report
==================================================

1. Files Modified: None yet
2. Variant Image Fields Found: ${Array.from(imageFields).join(', ')}
3. Number of Products Supporting Variant Images (Sample of 50): ${productsWithVariantImages}
4. Number of Products Without Variant Images (Sample of 50): ${productsWithoutVariantImages}
5. Total Variants Checked: ${totalVariantsChecked}
6. Variants with Images: ${variantsWithImages}

==================================================`;

  const fs = require('fs');
  fs.writeFileSync('Variant_Image_Audit_Report.txt', report);
  console.log(report);
  process.exit();
}

run();
