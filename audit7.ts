import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({category: 'Electronics'});
  for (const p of products) {
    console.log(p.category, p.name);
  }

  await mongoose.disconnect();
  process.exit(0);
}

check();
