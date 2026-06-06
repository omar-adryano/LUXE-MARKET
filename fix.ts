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

    if (nameStr.includes('silver') || nameStr.includes('titanium') || nameStr.includes('tungsten') || nameStr.includes('zircon')) {
      if (!nameStr.includes('light') && !nameStr.includes('smart') && !nameStr.includes('phone') && !nameStr.includes('bracket')) {
         newCat = 'Apparel & Fashion';
      }
    }

    if (nameStr.includes('serum') || nameStr.includes('moisturizing') || nameStr.includes('cream') || nameStr.includes('gummies') || nameStr.includes('supplement') || nameStr.includes('enhancement')) {
      newCat = 'Beauty & Skincare';
    }

    if (nameStr.includes('toy') || nameStr.includes('blocks') || nameStr.includes('bubble') || nameStr.includes('doll') || nameStr.includes('play')) {
      newCat = 'Baby & Kids Toys';
    }

    if (nameStr.includes('wall mounted') || nameStr.includes('stain removing') || nameStr.includes('anti theft') || nameStr.includes('clean') || nameStr.includes('trash') || nameStr.includes('blanket') || nameStr.includes('cushion')) {
      newCat = 'Home & Kitchen';
    }

    if (nameStr.includes('bag') || nameStr.includes('wallet')) {
      newCat = 'Travel Accessories';
    }
    if (nameStr.includes('yoga') || nameStr.includes('fitness')) {
      newCat = 'Fitness & Health';
    }

    if (nameStr.includes('phone') && !nameStr.includes('microphone')) {
       newCat = 'Phone Accessories';
    }
    
    // Explicitly fix the specific ones
    if (nameStr.includes('anti theft')) newCat = 'Home & Kitchen';
    if (nameStr.includes('germ killing')) newCat = 'Home & Kitchen';
    if (nameStr.includes('four wheel drive off')) newCat = 'Baby & Kids Toys';

    if (newCat !== currCat) {
       console.log(`Moving [${currCat}] to [${newCat}]: ${p.name}`);
       p.category = newCat;
       await p.save();
       movedCount++;
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

fixCat();
