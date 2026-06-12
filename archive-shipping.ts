import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;
  
  const products = await db.collection('products').find({ source: 'cj' }).toArray();
  const caches = await db.collection('shippingcaches').find().toArray();
  
  const targetCountries = ["US", "CA", "GB", "DE", "FR", "AU", "AE", "SA", "SG", "EG"];
  
  const cacheMap = new Map();
  for (const c of caches) {
      if (!cacheMap.has(c.vid)) cacheMap.set(c.vid, []);
      cacheMap.get(c.vid).push(c.countryCode);
  }

  let totalProductsBefore = products.length;
  let productsArchived = 0;
  let productsRemainingActive = 0;
  let productsSkipped = 0;
  
  const bulkOps = [];

  for (const p of products) {
      const pCache = p.vid ? (cacheMap.get(p.vid) || []) : [];
      const hasTarget = targetCountries.some(tc => pCache.includes(tc));
      
      if (hasTarget) {
          productsRemainingActive++;
          if (!p.isPublished || p.isArchived) {
              bulkOps.push({
                  updateOne: {
                      filter: { _id: p._id },
                      update: { $set: { isPublished: true, isArchived: false } }
                  }
              });
          }
      } else {
          // No target, archive it
          if (p.isPublished || !p.isArchived) {
              bulkOps.push({
                  updateOne: {
                      filter: { _id: p._id },
                      update: { $set: { isPublished: false, isArchived: true } }
                  }
              });
              productsArchived++;
          } else {
              // Already archived
              productsArchived++;
              productsSkipped++; 
          }
      }
  }

  if (bulkOps.length > 0) {
      await db.collection('products').bulkWrite(bulkOps);
  }

  const archivedThisTime = productsArchived - productsSkipped;

  let out = `==================================================
Archive Unsupported Products Report
==================================================

Products Archived: ${archivedThisTime}
Products Remaining Active: ${productsRemainingActive}
Products Skipped: ${productsSkipped}

==================================================
Final Summary
==================================================

Total Products Before: ${totalProductsBefore}
Total Active Products After: ${productsRemainingActive}
Total Archived Products: ${productsArchived}
==================================================
`;

  fs.writeFileSync('Archive_Unsupported_Products_Report.txt', out);
  console.log(out);
  process.exit(0);
}

run();
