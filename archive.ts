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
  let totalActiveBefore = allProducts.filter(p => p.isPublished === true).length;
  
  let productsArchived = 0;
  let productsRemainingActive = 0;
  let productsSkipped = 0;
  
  const bulkOps = [];

  for (const p of allProducts) {
      if (p.source === 'cj') {
          const pCache = p.vid ? (cacheMap.get(p.vid) || []) : [];
          const hasTarget = targetCountries.some(tc => pCache.includes(tc));
          
          if (!hasTarget || !p.vid || p.vid.trim() === '') {
              // Group C: "No valid shipping route"
              if (p.isPublished === true) {
                  // Archiving it now
                  bulkOps.push({
                      updateOne: {
                          filter: { _id: p._id },
                          update: { $set: { isPublished: false, isArchived: true } }
                      }
                  });
                  productsArchived++;
              }
          } else {
              // It has a valid route. 
              productsSkipped++; // skipped from archiving
              if (p.isPublished === true) {
                  productsRemainingActive++;
              }
          }
      } else {
          // Other sources
          productsSkipped++;
          if (p.isPublished === true) {
             productsRemainingActive++;
          }
      }
  }

  if (bulkOps.length > 0) {
      await db.collection('products').bulkWrite(bulkOps);
  }

  const finalActive = totalActiveBefore - productsArchived;
  const finalArchived = allProducts.length - finalActive;

  let out = `==================================================

Generate Report

Products Archived
${productsArchived}

Products Remaining Active
${finalActive}

Products Skipped
${productsSkipped}

==================================================

Final Summary

Total Products Before
${totalProductsBefore}

Total Active Products After
${finalActive}

Total Archived Products
${finalArchived}

==================================================
`;

  fs.writeFileSync('Archive_Report.txt', out);
  console.log(out);
  process.exit(0);
}

run();
