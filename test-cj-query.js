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

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const db = mongoose.connection.db;
  const p = await db.collection('products').findOne({ source: 'cj' });

  console.log("Product to check:", p._id, p.aliexpressProductId, p.name);

  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}/product/query?pid=${p.aliexpressProductId}`, {
    headers: { 'CJ-Access-Token': token }
  });
  const data = await response.json();
  
  console.log("Response:", JSON.stringify(data, null, 2));

  process.exit(0);
}

run();
