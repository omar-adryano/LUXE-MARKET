import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;
  
  const allProducts = await db.collection('products').find().toArray();
  const caches = await db.collection('shippingcaches').find().toArray();
  
  const targetCountries = ["US", "CA", "GB", "DE", "FR", "AU", "AE", "SA", "SG", "EG"];
  
  const cacheMap = new Map();
  for (const c of caches) {
      if (!cacheMap.has(c.vid)) cacheMap.set(c.vid, []);
      cacheMap.get(c.vid).push(c.countryCode);
  }

  let totalProductsBefore = allProducts.length;
  let productsArchived = 0;
  let productsRemainingActive = 0;
  let productsSkipped = 0;
  let productsAlreadyArchivedAndSkipped = 0;
  
  const bulkOps = [];

  for (const p of allProducts) {
      if (p.source === 'cj') {
          const pCache = p.vid ? (cacheMap.get(p.vid) || []) : [];
          const hasTarget = targetCountries.some(tc => pCache.includes(tc));
          
          if (hasTarget) {
              productsRemainingActive++;
              // Ensure it's published and not archived if it works
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
                  productsArchived++; // Note: counting as archived
                  productsAlreadyArchivedAndSkipped++; 
              }
          }
      } else {
          // Other source
          if (p.isPublished && !p.isArchived) {
              productsRemainingActive++;
          } else {
              productsArchived++; // Assuming it was archived
              productsAlreadyArchivedAndSkipped++;
          }
          productsSkipped++; // Skipped because not CJ
      }
  }

  if (bulkOps.length > 0) {
      await db.collection('products').bulkWrite(bulkOps);
  }

  const archivedThisTime = productsArchived - productsAlreadyArchivedAndSkipped;

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
