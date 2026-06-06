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
    
    // Check if definitely fashion/jewelry
    const isFashion = nameStr.includes('ring') && !nameStr.includes('light') && !nameStr.includes('smart') || nameStr.includes('necklace') || nameStr.includes('bracelet') || nameStr.includes('earring') || nameStr.includes('jewelry') || nameStr.includes('clothes') || nameStr.includes('shirt') || nameStr.includes('pants') || nameStr.match(/\bbag\b/) && !nameStr.includes('waist') && !nameStr.includes('storage') || nameStr.includes('wallet') || nameStr.includes('shoes');
    
    if (isFashion && (currCat === 'Electronics' || currCat === 'Phone Accessories' || currCat === 'Smart Gadgets')) {
         newCat = 'Apparel & Fashion';
    }

    if (nameStr.includes('phone') || nameStr.includes('charger') || nameStr.includes('cable') || nameStr.includes('case') && nameStr.includes('iphone') || nameStr.includes('screen protector')) {
         if (currCat !== 'Phone Accessories' && currCat !== 'Electronics') {
             newCat = 'Phone Accessories';
         }
    }

    if (nameStr.includes('earbud') || nameStr.includes('smart watch') || nameStr.includes('smartwatch') || nameStr.includes('power bank')) {
         newCat = 'Electronics';
    }

    // specific strict rules from prompt for Smart Gadgets
    if (nameStr.includes('drone') || nameStr.includes('camera')) {
         newCat = 'Smart Gadgets';
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

  console.log('\n--- REPORT ---');
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
