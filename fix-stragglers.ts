import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected');

  const updates = [
    { match: /Indoor Unit Real Time Monitoring/, cat: 'Smart Gadgets' },
    { match: /Load-bearing Universal Plastic Caster Wheel/, cat: 'Home & Kitchen' },
    { match: /Montessori Brain Blocks/, cat: 'Baby & Kids Toys' },
    { match: /Asymmetrical Cross Ring/, cat: 'Apparel & Fashion' },
    { match: /Nasal Pillow Silicone/, cat: 'Beauty & Skincare' },
    { match: /Fragrance Cologne/, cat: 'Beauty & Skincare' },
    { match: /Cotton Sportswear Set/, cat: 'Apparel & Fashion' }
  ];

  for (const u of updates) {
    const res = await Product.updateMany({ name: u.match }, { category: u.cat });
    console.log(`Updated ${u.match}: ${res.modifiedCount}`);
  }

  await mongoose.disconnect();
}

fix();
