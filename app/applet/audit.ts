import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let beforeCounts: Record<string, number> = {};
  let afterCounts: Record<string, number> = {};
  let movedCount = 0;

  for (const p of products) {
    if (!beforeCounts[p.category]) beforeCounts[p.category] = 0;
    beforeCounts[p.category]++;

    let newCategory = p.category;
    const nameStr = (p.name || '').toLowerCase();
    
    // Check for Jewelry in Electronics
    if (nameStr.includes('ring') || nameStr.includes('necklace') || nameStr.includes('bracelet') || nameStr.includes('earring') || nameStr.includes('jewelry') || nameStr.includes('silver') || nameStr.includes('gold') || nameStr.includes('zircon') || nameStr.includes('pendant')) {
      // Exclude things that are clearly electronics like "ring light" or "smart ring"
      if (!nameStr.includes('smart ring') && !nameStr.includes('ring light') && !nameStr.includes('key ring')) { 
        newCategory = 'Jewelry & Accessories';
      }
    }
    
    // Check if it's Phone Accessories
    if (nameStr.includes('phone case') || nameStr.includes('screen protector') || nameStr.includes('magsafe') || nameStr.includes('iphone') || nameStr.includes('samsung case') || nameStr.includes('charger') || nameStr.includes('cable') || nameStr.includes('power bank') || nameStr.includes('phone holder')) {
      newCategory = 'Phone Accessories';
    } else if (nameStr.includes('smart') || nameStr.includes('drone') || nameStr.includes('speaker') || nameStr.includes('earbuds') || nameStr.includes('headphone') || nameStr.includes('watch')) {
      newCategory = 'Smart Gadgets';
    } else if (nameStr.includes('kitchen') || nameStr.includes('home') || nameStr.includes('mug') || nameStr.includes('coffee') || nameStr.includes('decor')) {
      newCategory = 'Home & Kitchen';
    } else if (nameStr.includes('beauty') || nameStr.includes('skin') || nameStr.includes('face') || nameStr.includes('hair') || nameStr.includes('nail') || nameStr.includes('makeup')) {
      newCategory = 'Beauty & Skincare';
    } else if (nameStr.includes('pet') || nameStr.includes('dog') || nameStr.includes('cat') || nameStr.includes('toy')) {
      newCategory = 'Pet Supplies';
    } else if (nameStr.includes('fitness') || nameStr.includes('workout') || nameStr.includes('gym') || nameStr.includes('yoga') || nameStr.includes('sport')) {
      newCategory = 'Fitness & Health';
    }

    // Force fixing jewelry out of electronics
    if (p.category === 'Electronics' && newCategory === 'Electronics') {
       if (nameStr.includes('jewelry') || nameStr.match(/\b(ring|necklace|bracelet|earring)\b/)) {
         if (!nameStr.includes('smart') && !nameStr.includes('light')) {
           newCategory = 'Jewelry & Accessories';
         }
       }
    }
    
    // Fallback for general electronics
    if (p.category === 'Electronics' && newCategory === 'Jewelry & Accessories') {
         // Keep the changes
    } else if (p.category === 'Electronics') {
        const isElectronics = nameStr.includes('usb') || nameStr.includes('led') || nameStr.includes('lamp') || nameStr.includes('camera') || nameStr.includes('adapter') || nameStr.includes('mouse') || nameStr.includes('keyboard');
        if (!isElectronics) {
           // Might still be misclassified
        }
    }

    if (newCategory !== p.category) {
       console.log(`Moving [${p.category}] to [${newCategory}]: ${p.name}`);
       p.category = newCategory;
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

audit();
