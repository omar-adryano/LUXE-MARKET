import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function listAll() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const products = await Product.find({ category: 'Phone Accessories' });
  console.log('--- PHONE ACCESSORIES ---');
  products.forEach(p => console.log(`[${p.category}] ${p.name}`));
  
  const electronics = await Product.find({ category: 'Electronics' });
  console.log('--- ELECTRONICS ---');
  electronics.forEach(p => console.log(`[${p.category}] ${p.name}`));
  
  const smart = await Product.find({ category: 'Smart Gadgets' });
  console.log('--- SMART GADGETS ---');
  smart.forEach(p => console.log(`[${p.category}] ${p.name}`));

  await mongoose.disconnect();
}
listAll();
