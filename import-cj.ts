import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const allProducts = await Product.find({});
  const countBefore = allProducts.length;
  const cjCountBefore = allProducts.filter(p => p.source === 'cj').length;
  const manualCountBefore = countBefore - cjCountBefore;

  console.log(`Total products before: ${countBefore}`);
  console.log(`CJ products before: ${cjCountBefore}`);
  console.log(`Manual products before: ${manualCountBefore}`);

  let importedCount = 0;
  let skippedCount = 0;
  let imageFailedCount = 0;
  
  let page = 1;
  let importedCjProducts = [];
  const categoryCounts: Record<string, number> = {};
  
  while (importedCount < 100) {
    let list;
    try {
       const res = await CJDropshippingService.getProducts('', page);
       list = res.list || res;
    } catch(e: any) {
       console.log("Failed to get CJ products page", page, e.message);
       break;
    }
    
    if (!list || !Array.isArray(list) || list.length === 0) {
       console.log("No more products list or unexpected format. list:", list?.length);
       break;
    }

    for (const item of list) {
       if (importedCount >= 100) break;
       
       const pid = item.pid || item.productId || item.id;
       if (!pid) { skippedCount++; continue; }

       const existing = await Product.findOne({ aliexpressProductId: pid });
       if (existing) { skippedCount++; continue; }

       let info;
       try {
         info = await CJDropshippingService.getProductInfo(pid);
       } catch(e) {
         skippedCount++; continue;
       }

       if (!info) { skippedCount++; continue; }

       // Price check
       const getPrices = () => {
          let p = 0;
          if (info.sellPrice) p = Number(info.sellPrice);
          else if (info.variants && info.variants.length > 0) p = Number(info.variants[0].variantSellPrice) || Number(info.variants[0].sellPrice) || 0;
          return p > 0;
       };
       if(!getPrices()) { skippedCount++; continue; }
       
       // Stock check
       let listedNum = info.listedNum;
       if (typeof listedNum !== 'number') {
           listedNum = Number(listedNum);
       }
       if (isNaN(listedNum) || listedNum <= 0) {
           listedNum = 100; // As fallback used in importProductToDB
       }

       // Image check
       let finalImage = info.productImageSet?.[0] || info.bigImage || '';
       if (!finalImage && info.productImage) {
         try {
           const parsed = JSON.parse(info.productImage);
           if (Array.isArray(parsed) && parsed.length > 0) finalImage = parsed[0];
           else if (typeof parsed === 'string') finalImage = parsed;
         } catch {
           if (typeof info.productImage === 'string') finalImage = info.productImage;
         }
       }

       if (!finalImage) { skippedCount++; continue; }
       
       if (finalImage.startsWith('//')) finalImage = 'https:' + finalImage;
       
       try {
          const imgRes = await fetch(finalImage, { method: 'HEAD', timeout: 5000 });
          if (!imgRes.ok) {
             imageFailedCount++;
             skippedCount++;
             continue;
          }
       } catch(e) {
          imageFailedCount++;
          skippedCount++;
          continue;
       }

       try {
           const product = await CJDropshippingService.importProductToDB(pid, finalImage);
           const n = product.name.toLowerCase();
           let cat = 'Home & Kitchen'; // Default valid storefront category
           
           if (n.includes('sneaker') || n.includes('shoe') || n.includes('boot') || n.includes('shirt') || n.includes('dress') || n.includes('coat') || n.includes('suit') || n.includes('jacket') || n.includes('pants')) {
             cat = 'Apparel & Fashion';
           } else if (n.includes('headphone') || n.includes('earbud') || n.includes('speaker') || n.includes('electronic')) {
             cat = 'Electronics';
           } else if (n.includes('ring') || n.includes('necklace') || n.includes('bracelet') || n.includes('jewelry') || (n.includes('watch') && !n.includes('smart'))) {
             cat = 'Jewelry & Watches';
           } else if (n.includes('skincare') || n.includes('serum') || n.includes('makeup') || n.includes('beauty')) {
             cat = 'Beauty & Skincare';
           } else if (n.includes('pet') || n.includes('dog') || n.includes('cat')) {
             cat = 'Pet Supplies';
           } else if (n.includes('smart') && n.includes('watch')) {
             cat = 'Smart Gadgets';
           } else if (n.includes('phone') && (n.includes('case') || n.includes('holder') || n.includes('charger'))) {
             cat = 'Phone Accessories';
           }

           product.category = cat;
           await product.save();
           
           importedCount++;
           importedCjProducts.push(product);
           categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
           console.log(`Imported ${importedCount}/100: ${product.name}`);
       } catch (e: any) {
           skippedCount++;
           console.log(`Failed import for ${pid}: ${e.message}`);
       }
    }
    page++;
    
    // Prevent infinite loops
    if (page > 30) {
       console.log("Reached page 30, stopping to prevent infinite loops.");
       break;
    }
  }

  const afterAllProducts = await Product.find({});
  const countAfter = afterAllProducts.length;

  console.log(`\n==== IMPORT REPORT ====`);
  console.log(`Count Before: ${countBefore}`);
  console.log(`Count After: ${countAfter}`);
  console.log(`Imported: ${importedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Image Validation Failures: ${imageFailedCount}`);
  
  console.log(`\nTop Categories Added:`);
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, cnt]) => console.log(`- ${cat}: ${cnt}`));
    
  console.log(`\n==== PRODUCT AUDIT SAMPLE ====`);
  
  const sample = importedCjProducts.sort(() => 0.5 - Math.random()).slice(0, 10);
  sample.forEach((p, idx) => {
     console.log(`${idx + 1}. ${p.name}`);
     console.log(`   Category: ${p.category}`);
     console.log(`   CJ Category: ${p.cjCategory}`);
     console.log(`   Price: $${p.price}`);
     console.log(`   Image URL: ${p.image}\n`);
  });

  process.exit(0);
}

run();
