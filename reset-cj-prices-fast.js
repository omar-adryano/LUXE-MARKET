import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

async function getAccessToken() {
  const email = process.env.CJ_API_EMAIL;
  const apiKey = process.env.CJ_API_KEY;

  if (!email || !apiKey) {
    throw new Error('CJ Dropshipping credentials not configured.');
  }

  const response = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: apiKey }),
  });

  const data = await response.json();
  if (!data.success || !data.data?.accessToken) {
    throw new Error(data.message || 'Authentication failed');
  }

  return data.data.accessToken;
}

const priceCache = new Map();

async function getProductInfo(token, productId) {
  if (priceCache.has(productId)) return priceCache.get(productId);
  const response = await fetch(`${BASE_URL}/product/query?pid=${productId}`, {
    headers: { 'CJ-Access-Token': token }
  });
  const data = await response.json();
  
  if (!data.result || !data.data) {
     return { error: true, raw: data };
  }

  priceCache.set(productId, data.data);
  return data.data;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const db = mongoose.connection.db;
  const products = await db.collection('products').find({ source: 'cj' }).toArray();
  
  if (products.length === 0) {
    console.log("No CJ products found.");
    process.exit(0);
  }

  console.log(`Found ${products.length} CJ products. Resetting prices with concurrency...`);
  
  let token;
  try {
    token = await getAccessToken();
  } catch (err) {
    console.error("Failed to get CJ access token:", err.message);
    process.exit(1);
  }

  let resetCount = 0;
  let skipCount = 0;
  let totalPriceBefore = 0;
  let totalPriceAfter = 0;
  let skippedReasons = {};
  const auditList = [];

  const CONCURRENCY = 25; 
  let i = 0;

  async function worker() {
    while (i < products.length) {
      const idx = i++;
      const product = products[idx];
      const currentPrice = product.price || 0;

      // Ensure we don't fetch if already processed in earlier run
      // IF we want to force reset, we process all. The prompt says "Restore all CJ imported products"
      
      if (!product.aliexpressProductId) {
         skippedReasons['No aliexpressProductId'] = (skippedReasons['No aliexpressProductId'] || 0) + 1;
         skipCount++;
         totalPriceAfter += currentPrice;
         continue;
      }

      try {
        const info = await getProductInfo(token, product.aliexpressProductId);
        if (!info || info.error) {
           skippedReasons['API returned no data'] = (skippedReasons['API returned no data'] || 0) + 1;
           skipCount++;
           totalPriceAfter += currentPrice;
           continue;
        }

        let cjPrice = 0;
        if (info.sellPrice) {
           cjPrice = Number(info.sellPrice);
        } else if (info.variants && info.variants.length > 0) {
           cjPrice = Number(info.variants[0].variantSellPrice) || Number(info.variants[0].sellPrice) || 0;
        }

        if (isNaN(cjPrice) || cjPrice <= 0) {
          skippedReasons['Invalid cjPrice parsed'] = (skippedReasons['Invalid cjPrice parsed'] || 0) + 1;
          cjPrice = currentPrice > 0 ? currentPrice : 10;
          skipCount++;
          totalPriceAfter += currentPrice;
        } else {
          // If the price is already correct or approximately correct, maybe don't update? No, strictly update.
          await db.collection('products').updateOne(
            { _id: product._id },
            { $set: { price: cjPrice } }
          );
          resetCount++;
          totalPriceAfter += cjPrice;

          auditList.push({
            name: product.name,
            currentPrice: currentPrice,
            cjPrice: cjPrice,
            finalPrice: cjPrice
          });
        }
      } catch (err) {
        skippedReasons[err.message] = (skippedReasons[err.message] || 0) + 1;
        skipCount++;
        totalPriceAfter += currentPrice;
      }
    }
  }

  const workers = [];
  for(let p of products) {
     totalPriceBefore += (p.price || 0); 
  }
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(worker());
  }
  
  await Promise.all(workers);

  if (auditList.length === 0 && products.length > 0) {
    console.log("WARN: All failed. First product aliexpressProductId:", products[0].aliexpressProductId);
  }

  console.log('\n\n--- PRICING RESET REPORT ---');
  console.log(`Total CJ products: ${products.length}`);
  console.log(`Products reset: ${resetCount}`);
  console.log(`Products skipped: ${skipCount}`);
  console.log(`Average price before reset: ${(totalPriceBefore / products.length).toFixed(2)}`);
  console.log(`Average price after reset: ${(totalPriceAfter / products.length).toFixed(2)}`);
  console.log(`Errors/Skipped Reasons: `, skippedReasons);
  
  console.log('\n--- RANDOM AUDIT (20 Products) ---');
  const shuffled = auditList.sort(() => 0.5 - Math.random());
  const auditSample = shuffled.slice(0, 20);
  
  auditSample.forEach((item, index) => {
    console.log(`${index + 1}. Product Name: ${item.name.slice(0, 50)}...`);
    console.log(`   Current Price (Before): $${item.currentPrice}`);
    console.log(`   Original CJ Price: $${item.cjPrice}`);
    console.log(`   Final Reset Price: $${item.finalPrice}`);
  });

  process.exit(0);
}

// Timeout to exit correctly before 60s
setTimeout(() => {
   console.log("Timed out internally manually");
   process.exit(0);
}, 50000);

run().catch(console.error);
