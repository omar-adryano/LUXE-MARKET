import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function fixCat() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({category: 'Electronics'});
  for (const p of products) {
     const nameStr = p.name.toLowerCase();
     if (nameStr.includes('titanium') || nameStr.includes('silver') || nameStr.includes('tungsten') || nameStr.includes('cross ring')) {
         p.category = 'Apparel & Fashion';
         await p.save();
         console.log('Moved to Fashion:', p.name);
     } else if (nameStr.includes('smartwatch')) {
         p.category = 'Smart Gadgets';
         await p.save();
         console.log('Moved to Smart Gadgets:', p.name);
     }
  }

  await mongoose.disconnect();
  process.exit(0);
}

fixCat();
