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

    // Fix Jewelry in Electronics
    if (currCat === 'Electronics') {
      if (nameStr.includes('ring') || nameStr.includes('earring') || nameStr.includes('earrings') || nameStr.includes('jewelry') || nameStr.includes('pendant') || nameStr.includes('necklace') || nameStr.includes('bracelet')) {
         newCat = 'Apparel & Fashion';
      }
    }
    
    // Specifically fix some stuff
    if (nameStr.includes('dog') || nameStr.includes('cat ') || nameStr.includes('pet')) {
      newCat = 'Pet Supplies';
    } else if (nameStr.includes('phone case') || nameStr.includes('tempered glass') || nameStr.includes('screen protector') || nameStr.includes('charger') && !nameStr.includes('watch') && !nameStr.includes('laptop')) {
      newCat = 'Phone Accessories';
    } else if (nameStr.includes('earbuds') || nameStr.includes('drone') || nameStr.includes('speaker') || nameStr.includes('camera') || nameStr.includes('smartwatch')) {
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
       // if it's bed it could be pet if pet is in the name, but pet is checked first.
       newCat = 'Home & Kitchen';
    }

    // Move any other jewelry to Apparel & Fashion
    if (nameStr.includes('ring ') || nameStr.includes('earring') || nameStr.match(/(\s|^)ring(\s|$)/)) {
       if (!nameStr.includes('light') && !nameStr.includes('smart') && !nameStr.includes('phone') && !nameStr.includes('bracket')) {
          newCat = 'Apparel & Fashion';
       }
    }
    
    // There are some electronics products missing? Let's check CJ category or something if they imported fashion instead of electronics.
    // If old electronics are empty, do we need to seed "Real Electronics" so that the category works? The prompt doesn't strictly say it, but I may need to fetch some actual Electronics. Wait, the prompt says "Fix the category assignments without deleting valid products." and "Generate a report showing..."
    
    if (newCat !== currCat) {
       console.log(`Will move: "${p.name}"\n  from [${currCat}] to [${newCat}]`);
       p.category = newCat;
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

fixCat();
