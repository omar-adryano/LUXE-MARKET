import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

function appendLog(msg: string) {
    fs.appendFileSync('import_report.txt', msg + "\n");
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  appendLog("Connected to DB.");

  const allProducts = await Product.find({});
  const countBefore = allProducts.length;
  const cjCountBefore = allProducts.filter(p => p.source === 'cj').length;
  const manualCountBefore = countBefore - cjCountBefore;

  appendLog(`Total products before: ${countBefore}`);
  appendLog(`CJ products before: ${cjCountBefore}`);
  appendLog(`Manual products before: ${manualCountBefore}`);

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
       appendLog(`Failed to get CJ products page: ${page} - ${e.message}`);
       break;
    }
    
    if (!list || !Array.isArray(list) || list.length === 0) {
       appendLog(`No more products list or unexpected format. list: ${list?.length}`);
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

       if (!finalImage || finalImage.includes('placeholder')) { skippedCount++; imageFailedCount++; continue; }
       
       if (finalImage.startsWith('//')) finalImage = 'https:' + finalImage;
       
       // Image validation failures
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
           } else if (n.includes('office') || n.includes('desk') || n.includes('keyboard')) {
             cat = 'Office & Desk';
           } else if (n.includes('baby') || n.includes('kid')) {
             cat = 'Baby & Kids';
           } else if (n.includes('fitness') || n.includes('workout') || n.includes('gym')) {
             cat = 'Fitness & Health';
           }

           product.category = cat;
           await product.save();
           
           importedCount++;
           importedCjProducts.push(product);
           categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
           appendLog(`Imported ${importedCount}/100: ${product.name}`);
       } catch (e: any) {
           skippedCount++;
           appendLog(`Failed import for ${pid}: ${e.message}`);
       }
    }
    page++;
    
    // Prevent infinite loops
    if (page > 50) {
       appendLog("Reached page 50, stopping to prevent infinite loops.");
       break;
    }
  }

  const afterAllProducts = await Product.find({});
  const countAfter = afterAllProducts.length;

  fs.writeFileSync('import_results.json', JSON.stringify({
     countBefore,
     countAfter,
     importedCount,
     skippedCount,
     imageFailedCount,
     categoryCounts,
     importedCjProducts
  }));

  appendLog(`\n==== IMPORT REPORT ====`);
  appendLog(`Count Before: ${countBefore}`);
  appendLog(`Count After: ${countAfter}`);
  appendLog(`Imported: ${importedCount}`);
  appendLog(`Skipped: ${skippedCount}`);
  appendLog(`Image Validation Failures: ${imageFailedCount}`);
  
  appendLog(`\nTop Categories Added:`);
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, cnt]) => appendLog(`- ${cat}: ${cnt}`));
    
  appendLog(`\n==== PRODUCT AUDIT SAMPLE ====`);
  
  const sample = importedCjProducts.sort(() => 0.5 - Math.random()).slice(0, 10);
  sample.forEach((p, idx) => {
     appendLog(`${idx + 1}. ${p.name}`);
     appendLog(`   Category: ${p.category}`);
     appendLog(`   CJ Category: ${p.cjCategory}`);
     appendLog(`   Price: $${p.price}`);
     appendLog(`   Image URL: ${p.image}\n`);
  });

  process.exit(0);
}

run();
