import mongoose from 'mongoose';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();

  const d1 = JSON.parse(fs.readFileSync('image_results.json'));
  const d2 = JSON.parse(fs.readFileSync('ship_results.json'));

  const imageC_ids = new Set(d1.C.map(i => i.p._id.toString()));
  const imageD_ids = new Set(d1.D.map(i => i.p._id.toString()));
  const shipC_ids = new Set(d2.C.map(i => i.p._id.toString()));
  const shipB_ids = new Set(d2.B.map(i => i.toString()));
  
  let IMAGE_A_count = 0;
  let IMAGE_B_count = 0;
  let IMAGE_C_count = d1.C.length;
  let IMAGE_D_count = d1.D.length;
  
  let SHIP_A_count = d2.A;
  let SHIP_B_count = d2.B.length;
  let SHIP_C_count = d2.C.length;

  const imageB_ids = new Set();
  
  for (const p of products) {
     const id = p._id.toString();
     if (!imageC_ids.has(id) && !imageD_ids.has(id)) {
        let thumbnails = Array.isArray(p.thumbnails) ? p.thumbnails : [];
        const uniqueImages = new Set([p.image, ...thumbnails]);
        if (uniqueImages.size <= 1) {
            IMAGE_B_count++;
            imageB_ids.add(id);
        } else {
            IMAGE_A_count++;
        }
     }
  }

  const deleteSet = new Set([...imageC_ids, ...imageD_ids, ...shipC_ids]);
  
  const repairSet = new Set();
  for (const id of [...imageB_ids, ...shipB_ids]) {
      if (!deleteSet.has(id)) {
          repairSet.add(id);
      }
  }

  const safeCount = products.length - deleteSet.size - repairSet.size;

  console.log(`Total Products`);
  console.log(`${products.length}\n`);

  console.log(`IMAGE_A count`);
  console.log(`${IMAGE_A_count}\n`);
  
  console.log(`IMAGE_B count`);
  console.log(`${IMAGE_B_count}\n`);

  console.log(`IMAGE_C count`);
  console.log(`${IMAGE_C_count}\n`);

  console.log(`IMAGE_D count`);
  console.log(`${IMAGE_D_count}\n`);
  
  console.log(`SHIP_A count`);
  console.log(`${SHIP_A_count}\n`);

  console.log(`SHIP_B count`);
  console.log(`${SHIP_B_count}\n`);

  console.log(`SHIP_C count`);
  console.log(`${SHIP_C_count}\n`);

  console.log(`==================================================`);
  console.log(`SHOW LISTS`);
  console.log(`==================================================\n`);
  
  d1.C.forEach(item => {
    console.log(`Product Name: ${item.p.name}`);
    console.log(`Product ID: ${item.p._id}`);
    console.log(`Reason: ${item.reason}\n`);
  });

  d1.D.forEach(item => {
    console.log(`Product Name: ${item.p.name}`);
    console.log(`Product ID: ${item.p._id}`);
    console.log(`Reason: ${item.reason}\n`);
  });

  d2.C.forEach(item => {
    console.log(`Product Name: ${item.p.name}`);
    console.log(`Product ID: ${item.p._id}`);
    console.log(`Reason: ${item.reason}\n`);
  });

  console.log(`==================================================`);
  console.log(`FINAL REPORT`);
  console.log(`==================================================`);
  console.log(`Safe To Keep:\n${safeCount} products\n`);
  console.log(`Repairable:\n${repairSet.size} products\n`);
  console.log(`Safe To Delete:\n${deleteSet.size} products`);
  process.exit(0);
}
run();
