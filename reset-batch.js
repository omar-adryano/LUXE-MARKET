import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

async function getAccessToken() {
  const email = process.env.CJ_API_EMAIL;
  const apiKey = process.env.CJ_API_KEY;

  if (!email || !apiKey) throw new Error('CJ Dropshipping credentials not configured.');

  const response = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: apiKey }),
  });

  const data = await response.json();
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
     return { error: true, code: data.code, msg: data.message };
  }

  priceCache.set(productId, data.data);
  return data.data;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;
  
  // Find only products that haven't been reset yet (meaning they don't have priceReset flag)
  const products = await db.collection('products').find({ source: 'cj', priceReset: { $ne: true } }).toArray();
  
  if (products.length === 0) {
    console.log("No CJ products need resetting.");
    process.exit(0);
  }

  console.log(`Found ${products.length} CJ products. Resetting prices sequentially (50ms delay)...`);
  
  const token = await getAccessToken();

  let resetCount = 0;
  let skipCount = 0;
  let skippedReasons = {};

  for (let i = 0; i < products.length; i++) {
     const product = products[i];
     
     if(i % 50 === 0 && i !== 0) {
         console.log(`Processed ${i}/${products.length}...`);
     }

     if (!product.aliexpressProductId) {
        skipCount++;
        continue;
     }

     try {
        const info = await getProductInfo(token, product.aliexpressProductId);
        if (!info || info.error) {
           skippedReasons[info.msg || 'Error'] = (skippedReasons[info.msg || 'Error'] || 0) + 1;
           skipCount++;
           
           // If we hit rate limit, let's back off dynamically
           if ((info.msg || '').toLowerCase().includes('rate')) {
              await new Promise(r => setTimeout(r, 2000));
           }
           continue;
        }

        let cjPrice = 0;
        if (info.sellPrice) {
           cjPrice = Number(info.sellPrice);
        } else if (info.variants && info.variants.length > 0) {
           cjPrice = Number(info.variants[0].variantSellPrice) || Number(info.variants[0].sellPrice) || 0;
        }

        if (isNaN(cjPrice) || cjPrice <= 0) {
          skipCount++;
        } else {
          await db.collection('products').updateOne(
            { _id: product._id },
            { $set: { price: cjPrice, priceReset: true } }
          );
          resetCount++;
        }
     } catch (err) {
        skipCount++;
     }
     
     // Throttle
     await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n--- BATCH COMPLETE ---');
  console.log(`Total: ${products.length}`);
  console.log(`Reset: ${resetCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Reasons:`, skippedReasons);

  process.exit(0);
}

run().catch(console.error);
