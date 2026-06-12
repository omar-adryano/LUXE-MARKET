import { CJDropshippingService } from './server/services/aliexpressService';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const prods = await db.collection('products').find({ source: 'cj' }).limit(35).toArray();
  let withVideo = 0;
  let noVideo = 0;
  let videoKeys: Set<string> = new Set();
  
  for(const p of prods) {
    try {
      const info = await CJDropshippingService.getProductInfo(p.aliexpressProductId);
      let foundVideo = false;
      for (const key of Object.keys(info)) {
         if (key.toLowerCase().includes('video')) {
            videoKeys.add(key);
            if (info[key]) foundVideo = true;
         }
      }
      
      if (foundVideo) {
         withVideo++;
      } else {
         noVideo++;
      }

      // CJ API has a 1 QPS limit; wait to avoid 429
      await delay(1200);

    } catch (e: any) {
      console.error(`Error with ${p.aliexpressProductId}: ${e.message}`);
    }
  }
  
  console.log(`Products with video: ${withVideo}`);
  console.log(`Products without video: ${noVideo}`);
  console.log(`Alternative endpoints/fields found: ${Array.from(videoKeys).join(', ')}`);
  console.log(`Marketing video availability: Unknown, strictly checking product properties.`);
  console.log(`Estimated percentage of catalog that could provide videos: ${Math.round((withVideo / prods.length) * 100)}%`);

  let report = `==================================================
CJ Marketing Video Audit Report
==================================================

Products with video: ${withVideo}
Products without video: ${noVideo}
Alternative endpoints found: ${Array.from(videoKeys).join(', ')}

Marketing video availability: These endpoints do not specifically isolate marketing materials (only productVideo properties are evident).
Estimated percentage of catalog that could provide videos: ${Math.round((withVideo / prods.length) * 100)}%

==================================================`;

  const fs = require('fs');
  fs.writeFileSync('CJ_Marketing_Video_Audit_Report.txt', report);
  process.exit();
}

run();
