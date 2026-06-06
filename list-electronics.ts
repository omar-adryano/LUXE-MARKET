import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function listAll() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const products = await Product.find({});
  for (const p of products) {
    if (p.category === 'Phone Accessories' || p.category === 'Smart Gadgets' || p.category === 'Electronics') {
      console.log(`[${p.category}] ${p.name}`);
    }
  }
  await mongoose.disconnect();
}
listAll();
