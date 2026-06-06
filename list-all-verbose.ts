import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function listAll() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const products = await Product.find({}).sort({ category: 1 });
  
  const byCategories: Record<string, string[]> = {};
  for (const p of products) {
    if (!byCategories[p.category]) byCategories[p.category] = [];
    byCategories[p.category].push(p.name);
  }
  
  for (const [cat, items] of Object.entries(byCategories)) {
    console.log(`\n--- ${cat.toUpperCase()} (${items.length}) ---`);
    items.forEach(i => console.log(`  ${i}`));
  }

  await mongoose.disconnect();
}
listAll();
