import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function fixCat() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let movedCount = 0;

  for (const p of products) {
    let currCat = p.category;
    let newCat = currCat;
    const nameStr = p.name.toLowerCase();

    if (nameStr.includes('cutting board')) newCat = 'Home & Kitchen';
    if (nameStr.includes('cat ') || nameStr.includes('dog ') || nameStr.includes('pet ')) newCat = 'Pet Supplies';
    if (nameStr.includes('footbag')) newCat = 'Fitness & Health';
    if (nameStr.includes('soap')) newCat = 'Beauty & Skincare';

    if (newCat !== currCat) {
       console.log(`Reverting/Fixing [${currCat}] to [${newCat}]: ${p.name}`);
       p.category = newCat;
       await p.save();
       movedCount++;
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

fixCat();
