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
  let misclassifiedFound = 0;

  for (const p of products) {
    if (!beforeCounts[p.category]) beforeCounts[p.category] = 0;
    beforeCounts[p.category]++;

    let currCat = p.category;
    let newCat = currCat;
    const nameStr = (p.name || '').toLowerCase();

    const isEarbud = nameStr.includes('earbud');
    const isWatch = nameStr.includes('smart watch') || nameStr.includes('smartwatch');
    const isPowerBank = nameStr.includes('power bank') || nameStr.includes('powerbank');
    
    // Explicit requested rule: Earbuds, Smart Watches, Power Banks -> Electronics
    if (isEarbud || isWatch || isPowerBank) {
       newCat = 'Electronics';
    } else if (nameStr.includes('charger') && !nameStr.includes('phone') && !nameStr.includes('wireless') && !nameStr.includes('car')) {
       // Only generic chargers to Electronics, phone chargers to Phone Accessories
       newCat = 'Electronics';
    } 
    
    if (nameStr.includes('phone') && !nameStr.includes('microphone') || nameStr.includes('case') && nameStr.includes('iphone') || nameStr.includes('screen protector') || nameStr.includes('cable') || nameStr.includes('phone holder') || nameStr.includes('magsafe') || nameStr.includes('wireless charger')) {
        newCat = 'Phone Accessories';
    }
    
    if (nameStr.includes('drone') || nameStr.includes('camera')) {
        newCat = 'Smart Gadgets';
    }

    if (nameStr.includes('ring') && !nameStr.includes('light') && !nameStr.includes('smart') || nameStr.includes('necklace') || nameStr.includes('bracelet') || nameStr.includes('earring') || nameStr.includes('jewelry') || nameStr.includes('shoes') || nameStr.includes('clothes') || nameStr.includes('shirt') || nameStr.includes('pants')) {
        newCat = 'Apparel & Fashion';
    }

    if (nameStr.includes('toy') || nameStr.includes('block') || nameStr.includes('balloon') || nameStr.includes('doll') || nameStr.includes('bubble') || nameStr.includes('play')) {
        newCat = 'Baby & Kids Toys';
    }

    if (nameStr.includes('car') || nameStr.includes('vehicle')) {
        if (nameStr.includes('organizer') || nameStr.includes('gap filler')) {
             newCat = 'Travel Accessories';
        }
    }

    if (nameStr.includes('light') && !nameStr.includes('ring light')) {
         if (nameStr.includes('garden') || nameStr.includes('villa')) {
              newCat = 'Home & Kitchen';
         }
    }

    if (newCat !== currCat) {
      misclassifiedFound++;
      movedCount++;
      p.category = newCat;
      await p.save();
    }

    if (!afterCounts[newCat]) afterCounts[newCat] = 0;
    afterCounts[newCat]++;
  }

  console.log('--- REPORT ---');
  console.log(`Total products audited: ${products.length}`);
  console.log(`Misclassified products found: ${misclassifiedFound}`);
  console.log(`Products moved: ${movedCount}`);
  
  console.log('\nFinal category counts:');
  for (const [cat, count] of Object.entries(afterCounts)) {
    console.log(` - ${cat}: ${count}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

audit();
