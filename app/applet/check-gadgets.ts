import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function listAll() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('--- Gadgets ---')
  const products = await Product.find({ category: 'Smart Gadgets' });
  for (const p of products) {
    console.log(p.category, ':', p.name);
  }
  console.log('--- Chargers ---')
  const chargers = await Product.find({ name: /charger/i });
  for (const p of chargers) {
    console.log(p.category, ':', p.name);
  }
  console.log('--- Earbuds ---')
  const earbuds = await Product.find({ name: /earbud/i });
  for (const p of earbuds) {
    console.log(p.category, ':', p.name);
  }
  await mongoose.disconnect();
}
listAll();
