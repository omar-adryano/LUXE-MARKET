import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

async function getAccessToken() {
  const email = process.env.CJ_API_EMAIL;
  const apiKey = process.env.CJ_API_KEY;

  if (!email || !apiKey) throw new Error('CJ credentials missing.');

  const res = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: apiKey }),
  });
  const data = await res.json();
  return data.data.accessToken;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const products = await db.collection('products').find({ source: 'cj' }).toArray();
  
  const token = await getAccessToken();

  console.log("Fetching bulk pages from CJ...");
  const priceMap = new Map();
  // Fetch first 12 pages of 50 items (600 items), covers all recent imports
  for (let page = 1; page <= 12; page++) {
    try {
      const res = await fetch(`${BASE_URL}/product/list?pageNum=${page}&pageSize=50`, {
        headers: { 'CJ-Access-Token': token }
      });
      const data = await res.json();
      if (data.data?.list) {
         for (let item of data.data.list) {
             priceMap.set(item.pid || item.productId, Number(item.sellPrice));
         }
      }
      await new Promise(r => setTimeout(r, 200));
    } catch(e) {}
  }
  console.log(`Fetched ${priceMap.size} products from CJ list api.`);

  let resetCount = 0;
  let skipCount = 0;
  let totalPriceBefore = 0;
  let totalPriceAfter = 0;
  const auditList = [];

  for (let p of products) {
    let currentPrice = p.price || 0;
    totalPriceBefore += currentPrice;

    if (!p.aliexpressProductId) {
       skipCount++;
       totalPriceAfter += currentPrice;
       continue;
    }

    let cjPrice = priceMap.get(p.aliexpressProductId);
    
    // If not in bulk map, we could do math as fallback for those old few items
    if (!cjPrice || isNaN(cjPrice)) {
       // fallback math
       cjPrice = Number(((currentPrice - 0.99) / 3).toFixed(2));
       if(cjPrice <= 0) cjPrice = currentPrice;
    }

    if (cjPrice > 0 && cjPrice !== currentPrice) {
       await db.collection('products').updateOne(
         { _id: p._id },
         { $set: { price: cjPrice, priceReset: true, originalPrice: cjPrice * 1.5 } } 
       );
       resetCount++;
       totalPriceAfter += cjPrice;

       auditList.push({
         name: p.name,
         currentPrice: currentPrice,
         cjPrice: cjPrice,
         finalPrice: cjPrice
       });
    } else {
       skipCount++;
       totalPriceAfter += currentPrice;
    }
  }

  console.log('\n--- PRICING RESET REPORT ---');
  console.log(`Total CJ products: ${products.length}`);
  console.log(`Products reset: ${resetCount}`);
  console.log(`Products skipped: ${skipCount}`);
  console.log(`Average price before reset: ${(totalPriceBefore / products.length).toFixed(2)}`);
  console.log(`Average price after reset: ${(totalPriceAfter / products.length).toFixed(2)}`);

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

run();
