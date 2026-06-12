import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CJShippingService } from './server/services/cjShippingService';

dotenv.config();

async function checkImage(url) {
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

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const products = await db.collection('products').find({}).toArray();
  const shippingCaches = await db.collection('shippingcaches').find({}).toArray();
  const vidHasShipping = new Set(shippingCaches.map(s => s.vid));

  const IMAGE_A = [];
  const IMAGE_B = [];
  const IMAGE_C = [];
  const IMAGE_D = [];

  const SHIP_A = [];
  const SHIP_B = [];
  const SHIP_C = [];
  
  // Custom simple queue for images so we don't spam 2500 HEAD requests at once
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

  const enqueue = (fn) => {
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
     let mainImageExists = p.image && typeof p.image === 'string' && p.image.trim() !== '';
     if (!mainImageExists) {
        IMAGE_C.push({ p, reason: 'Missing main image completely' });
     } else if (!p.image.startsWith('http')) {
        IMAGE_D.push({ p, reason: 'Main image URL invalid format' });
     } else {
        
        enqueue(async () => {
          const mainValid = await checkImage(p.image);
          if (!mainValid) {
             IMAGE_D.push({ p, reason: 'Main image broken (HTTP non-200)' });
          } else {
             let thumbnails = Array.isArray(p.thumbnails) ? p.thumbnails : [];
             let brokenThumb = false;
             let emptyThumb = false;
             for (const t of thumbnails) {
                if (!t || typeof t !== 'string' || t.trim() === '') {
                   emptyThumb = true;
                } else if (!t.startsWith('http')) {
                   brokenThumb = true;
                } else {
                   const tValid = await checkImage(t);
                   if (!tValid) brokenThumb = true;
                }
             }
             
             if (emptyThumb) {
               IMAGE_D.push({ p, reason: 'Empty URL in gallery array' });
             } else if (brokenThumb) {
               IMAGE_D.push({ p, reason: 'Broken gallery image URL' });
             } else {
               const uniqueImages = new Set([p.image, ...thumbnails]);
               if (uniqueImages.size <= 1) {
                  IMAGE_B.push({ p, reason: 'Only 1 unique image' });
               } else {
                  IMAGE_A.push({ p, reason: 'Healthy images' });
               }
             }
          }
        });
     }
  }

  // wait for queue to finish
  while (queue.length > 0 || active > 0) {
    await new Promise(r => setTimeout(r, 100));
  }

  for (let i = 0; i < products.length; i++) {
     const p = products[i];
     if (p.source !== 'cj') {
        SHIP_A.push({ p, reason: 'Not CJ product' });
        continue;
     }

     if (!p.vid || p.vid.trim() === '') {
        SHIP_C.push({ p, reason: 'Missing CJ VID entirely' });
        continue;
     }

     if (vidHasShipping.has(p.vid)) {
        SHIP_A.push({ p, reason: 'Healthy shipping cache' });
     } else {
        try {
           const routeResult = await CJShippingService.calculateFreight(p.vid, 'US', 1);
           if (routeResult && routeResult.data && routeResult.data.length > 0) {
              SHIP_B.push({ p, reason: 'Missing cache only' });
           } else {
              SHIP_C.push({ p, reason: 'No CJ shipping route available for US' });
           }
        } catch (e) {
           SHIP_C.push({ p, reason: `CJ shipping API error: ${e.message}` });
        }
        await new Promise(r => setTimeout(r, 1100)); // Respect CJ API rate limit
     }
  }

  console.log(`==================================================`);
  console.log(`OUTPUT`);
  console.log(`==================================================\n`);

  console.log(`Total Products: ${products.length}\n`);

  console.log(`IMAGE_A count: ${IMAGE_A.length}`);
  console.log(`IMAGE_B count: ${IMAGE_B.length}`);
  console.log(`IMAGE_C count: ${IMAGE_C.length}`);
  console.log(`IMAGE_D count: ${IMAGE_D.length}\n`);

  console.log(`SHIP_A count: ${SHIP_A.length}`);
  console.log(`SHIP_B count: ${SHIP_B.length}`);
  console.log(`SHIP_C count: ${SHIP_C.length}\n`);

  console.log(`==================================================`);
  console.log(`IMAGE_C LIST`);
  console.log(`==================================================`);
  IMAGE_C.forEach(item => {
    console.log(`Product Name: ${item.p.name}`);
    console.log(`Product ID: ${item.p._id}`);
    console.log(`Reason: ${item.reason}\n`);
  });

  console.log(`==================================================`);
  console.log(`IMAGE_D LIST`);
  console.log(`==================================================`);
  IMAGE_D.forEach(item => {
    console.log(`Product Name: ${item.p.name}`);
    console.log(`Product ID: ${item.p._id}`);
    console.log(`Reason: ${item.reason}\n`);
  });

  console.log(`==================================================`);
  console.log(`SHIP_C LIST`);
  console.log(`==================================================`);
  SHIP_C.forEach(item => {
    console.log(`Product Name: ${item.p.name}`);
    console.log(`Product ID: ${item.p._id}`);
    console.log(`Reason: ${item.reason}\n`);
  });

  const delSet = new Set([...IMAGE_C.map(i => i.p._id.toString()), ...IMAGE_D.map(i => i.p._id.toString()), ...SHIP_C.map(i => i.p._id.toString())]);
  const repairSet = new Set(SHIP_B.map(i => i.p._id.toString()));
  
  for (const id of delSet) {
     if (repairSet.has(id)) repairSet.delete(id);
  }

  const safeToKeepCount = products.length - delSet.size - repairSet.size;

  console.log(`==================================================`);
  console.log(`FINAL REPORT`);
  console.log(`==================================================`);
  console.log(`Safe To Keep:`);
  console.log(`${safeToKeepCount} products\n`);
  console.log(`Repairable:`);
  console.log(`${repairSet.size} products\n`);
  console.log(`Safe To Delete:`);
  console.log(`${delSet.size} products\n`);

  process.exit(0);
}

audit();
