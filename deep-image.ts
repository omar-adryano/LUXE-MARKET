import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import fs from 'fs';

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

async function auditImages() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();

  const IMAGE_A = [];
  const IMAGE_B = [];
  const IMAGE_C = [];
  const IMAGE_D = [];

  const CONCURRENCY = 30;
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

  while (queue.length > 0 || active > 0) {
    await new Promise(r => setTimeout(r, 100));
  }
  
  fs.writeFileSync('image_results.json', JSON.stringify({
    A: IMAGE_A.length,
    B: IMAGE_B.length,
    C: IMAGE_C,
    D: IMAGE_D
  }, null, 2));

  console.log('Image Audit Complete. Output written to image_results.json');
  process.exit(0);
}

auditImages();
