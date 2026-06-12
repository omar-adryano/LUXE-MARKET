import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CJDropshippingService } from './server/services/aliexpressService';
import fs from 'fs';

dotenv.config();

async function checkImage(url: string) {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  if (!url.startsWith('http')) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    return res.ok;
  } catch (e) {
    return false;
  }
}

let cjMutexLock = Promise.resolve();
async function cjMutex() {
  const wait = cjMutexLock;
  let release: any;
  cjMutexLock = new Promise(r => release = r);
  await wait;
  await new Promise(r => setTimeout(r, 1500));
  release();
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  
  // We'll use the proper schema or just standard
  const db = mongoose.connection.db;
  const d1 = JSON.parse(fs.readFileSync('image_results.json', 'utf8'));
  const brokenIds = new Set([...d1.C.map(i => i.p._id), ...d1.D.map(i => i.p._id)]);
  const products = await db.collection('products').find({ _id: { $in: Array.from(brokenIds).map(id => new mongoose.Types.ObjectId(id)) } }).toArray();

  let healthyCount = 412 + 88; // From previous run A + B
  let repairedCount = 0;
  let stillBroken = [];

  const CONCURRENCY = 15;
  let active = 0;
  const queue = [];

  const processQueue = async () => {
    while (queue.length > 0) {
      if (active < CONCURRENCY) {
        active++;
        const task = queue.shift();
        task().finally(() => {
          active--;
          processQueue();
        });
      } else {
        await new Promise(r => setTimeout(r, 50));
      }
    }
  };

  const enqueue = (fn: any) => {
    return new Promise((resolve) => {
      queue.push(async () => {
        const res = await fn();
        resolve(res);
      });
      if (active < CONCURRENCY) processQueue();
    });
  };

  for (let i = 0; i < products.length; i++) {
     const p = products[i];
     
     // Evaluate health
     enqueue(async () => {
       let p_isHealthy = false;
       let brokenReason = '';
       
       if (!p.image || typeof p.image !== 'string' || !p.image.startsWith('http')) {
          brokenReason = 'Missing/invalid main image URL';
       } else {
          const val = await checkImage(p.image);
          if (!val) brokenReason = 'Main image HTTP non-200';
       }
       
       let allThumbsValid = true;
       const thumbs = Array.isArray(p.thumbnails) ? p.thumbnails : [];
       let numThumbs = thumbs.length;
       
       if (!brokenReason) {
           for(const t of thumbs) {
              if (!t || !t.startsWith('http') || !(await checkImage(t))) {
                 allThumbsValid = false;
                 break;
              }
           }
       }
       
       const uniqueImages = new Set([p.image, ...thumbs].filter(Boolean));
       
       if (!brokenReason && allThumbsValid && uniqueImages.size > 1 && numThumbs > 0) {
           p_isHealthy = true;
       } else if (!brokenReason && !allThumbsValid) {
           brokenReason = 'Gallery images invalid or empty';
       } else if (!brokenReason && uniqueImages.size <= 1) {
           brokenReason = 'Only 1 unique image';
       } else if (!brokenReason && numThumbs === 0) {
           brokenReason = 'No gallery images';
       }

       if (p_isHealthy) {
           healthyCount++;
           return; // done with this product
       }

       // attempt repair
       let repaired = false;
       if (p.source === 'cj' && p.aliexpressProductId) {
           let info = null;
           let lastErr = null;
           for (let retry = 0; retry < 3; retry++) {
               try {
                   await cjMutex();
                   info = await CJDropshippingService.getProductInfo(p.aliexpressProductId);
                   break;
               } catch(e: any) {
                   lastErr = e;
                   if (e.message.includes('Product not found')) break;
               }
           }
           
           try {
               if (info) {
                   const cjSet = Array.isArray(info.productImageSet) ? info.productImageSet : [];
                   let tryMain = typeof info.productImage === 'string' ? info.productImage : (cjSet[0] || p.image);
                   
                   try {
                       const parsed = JSON.parse(tryMain);
                       if(Array.isArray(parsed) && parsed.length > 0) tryMain = parsed[0];
                   } catch(e){}


                   let cjMainValid = false;
                   if (tryMain && tryMain.startsWith('http') && (await checkImage(tryMain))) cjMainValid = true;
                   
                   let validThumbs = [];
                   for (const t of cjSet) {
                       if (t && t.startsWith('http') && (await checkImage(t))) {
                           validThumbs.push(t);
                       }
                   }
                   
                   const uniqueCjImages = new Set([tryMain, ...validThumbs].filter(Boolean));
                   if (cjMainValid && validThumbs.length > 0 && uniqueCjImages.size > 1) {
                       // Apply repair to DB
                       await db.collection('products').updateOne(
                           { _id: p._id },
                           { $set: { image: tryMain, thumbnails: validThumbs } }
                       );
                       repaired = true;
                       repairedCount++;
                   } else {
                       brokenReason += ' (Repair failed: CJ images also invalid)';
                   }
               } else {
                   brokenReason += ' (Repair failed: CJ info null or ' + (lastErr ? lastErr.message : 'unknown') + ')';
               }
           } catch(e: any) {
               brokenReason += ' (Repair error: ' + e.message + ')';
           }
       } else {
           brokenReason += ' (Repair skipped: Not a CJ product or no ID)';
       }
       
       if (!repaired) {
           stillBroken.push({ name: p.name, id: p._id.toString(), reason: brokenReason });
       }
     });
  }

  while (queue.length > 0 || active > 0) {
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`==================================================`);
  console.log(`Healthy Images`);
  console.log(`${healthyCount}`);
  console.log(`\nSuccessfully Repaired Images`);
  console.log(`${repairedCount}`);
  console.log(`\nStill Broken Images`);
  console.log(`${stillBroken.length}`);
  console.log(`==================================================\n`);

  for (const item of stillBroken) {
     console.log(`Product Name: ${item.name}`);
     console.log(`Product ID: ${item.id}`);
     console.log(`Reason: ${item.reason}\n`);
  }

  process.exit(0);
}

run();
