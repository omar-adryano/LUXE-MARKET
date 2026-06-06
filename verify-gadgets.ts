import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({ category: 'Smart Gadgets' });
  for (const p of products) {
      console.log(`- ${p.name}`);
  }
  console.log(`Total count: ${products.length}`);
  process.exit(0);
}
verify();
