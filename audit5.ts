import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function fixCat() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let beforeCounts: Record<string, number> = {};
  let afterCounts: Record<string, number> = {};
  let movedCount = 0;

  for (const p of products) {
    if (!beforeCounts[p.category]) beforeCounts[p.category] = 0;
    beforeCounts[p.category]++;

    let currCat = p.category;
    let newCat = currCat;
    const nameStr = (p.name || '').toLowerCase();

    // Map according to rules
    if (nameStr.includes('dog') || nameStr.includes('cat ') || nameStr.includes('pet')) {
      newCat = 'Pet Supplies';
    } else if (nameStr.includes('phone case') || nameStr.includes('tempered glass') || nameStr.includes('screen protector') || nameStr.includes('charger') || nameStr.includes('tripod') || nameStr.includes('selfie stick') || nameStr.includes('cooling fan')) {
      // Avoid watches missing out
      if (!nameStr.includes('watch') && !nameStr.includes('laptop')) {
         newCat = 'Phone Accessories';
      }
    } else if (nameStr.includes('earbuds') || nameStr.includes('drone') || nameStr.includes('speaker') || nameStr.includes('camera') || nameStr.includes('smartwatch') || nameStr.includes('headphone')) {
      newCat = 'Smart Gadgets'; // Or Electronics
    } else if (nameStr.includes('yoga') || nameStr.includes('fitness') || nameStr.includes('barbell') || nameStr.includes('dumbbell') || nameStr.includes('ab roller')) {
      newCat = 'Fitness & Health';
    } else if (nameStr.includes('hair dryer') || nameStr.includes('styling') || nameStr.includes('makeup') || nameStr.includes('skincare') || nameStr.includes('epilator') || nameStr.includes('facial') || nameStr.includes('massage')) {
      if (nameStr.includes('gun')) {
        newCat = 'Fitness & Health';
      } else {
        newCat = 'Beauty & Skincare';
      }
    } else if (nameStr.includes('coffee') || nameStr.includes('mug') || nameStr.includes('vacuum') || nameStr.includes('lamp') || nameStr.includes('humidifier') || nameStr.includes('bed') || nameStr.includes('pillow')) {
       newCat = 'Home & Kitchen';
    }

    // Fix Jewelry in Electronics OR ANYWHERE
    if (nameStr.includes('ring') || nameStr.includes('earring') || nameStr.includes('jewelry') || nameStr.includes('pendant') || nameStr.includes('necklace') || nameStr.includes('bracelet')) {
       if (!nameStr.includes('light') && !nameStr.includes('smart') && !nameStr.includes('phone') && !nameStr.includes('bracket')) {
          newCat = 'Apparel & Fashion';
       }
    }

    // Force strict rules for explicitly stated categories
    if (newCat === 'Electronics' && newCat !== currCat) {
      // ok
    }

    if (newCat !== currCat) {
       console.log(`Moving [${currCat}] to [${newCat}]: ${p.name}`);
       p.category = newCat;
       await p.save();
       movedCount++;
    }

    if (!afterCounts[p.category]) afterCounts[p.category] = 0;
    afterCounts[p.category]++;
  }

  console.log('\n--- REPORT ---');
  console.log(`Total products audited: ${products.length}`);
  console.log(`Products moved between categories: ${movedCount}`);
  
  console.log('\nCategory counts before fix:');
  for (const [cat, count] of Object.entries(beforeCounts)) {
    console.log(` - ${cat}: ${count}`);
  }

  console.log('\nCategory counts after fix:');
  for (const [cat, count] of Object.entries(afterCounts)) {
    console.log(` - ${cat}: ${count}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

fixCat();
