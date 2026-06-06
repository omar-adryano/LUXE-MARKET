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
    
    const isPet = nameStr.includes('dog') || nameStr.includes('cat ') || nameStr.includes('pet ') && !nameStr.includes('petals');
    const isFashion = nameStr.includes('ring') && !nameStr.includes('light') && !nameStr.includes('smart') || nameStr.includes('necklace') || nameStr.includes('bracelet') || nameStr.includes('earring') || nameStr.includes('jewelry') || nameStr.includes('clothes') || nameStr.includes('shirt') || nameStr.includes('pants') || nameStr.includes('wallet') || nameStr.includes('bag') && !nameStr.includes('waist bag') && !nameStr.includes('storage bag') || nameStr.includes('shoes') || nameStr.includes('silver') || nameStr.includes('titanium') || nameStr.includes('tungsten') || nameStr.includes('zircon');
    const isBeauty = nameStr.includes('beauty') || nameStr.includes('skin') || nameStr.includes('serum') || nameStr.includes('moisturizing') || nameStr.includes('cream') || nameStr.includes('hair') && !nameStr.includes('chair') || nameStr.includes('makeup') || nameStr.includes('soap') || nameStr.includes('gummies') || nameStr.includes('supplement') || nameStr.includes('enhancement');
    const isFitness = nameStr.includes('fitness') || nameStr.includes('yoga') || nameStr.includes('workout') || nameStr.includes('sport') || nameStr.includes('run') && !nameStr.includes('running the') || nameStr.includes('footbag');
    const isHome = nameStr.includes('home') || nameStr.includes('kitchen') || nameStr.includes('cushion') || nameStr.includes('clean') || nameStr.includes('trash') || nameStr.includes('mug') || nameStr.includes('board') || nameStr.includes('bed');
    const isPhoneAccessory = nameStr.includes('phone') && !nameStr.includes('microphone') || nameStr.includes('case') && nameStr.includes('iphone') || nameStr.includes('charger') || nameStr.includes('cable') || nameStr.includes('screen protector') || nameStr.includes('tempered glass');
    const isElectronics = nameStr.includes('earbud') || nameStr.includes('headphone') || nameStr.includes('power bank') || nameStr.includes('speaker') || nameStr.includes('smartwatch') || nameStr.includes('smart watch');
    const isGadget = nameStr.includes('drone') || nameStr.includes('camera');
    const isKids = nameStr.includes('toy') || nameStr.includes('doll ') || nameStr.includes('block') || nameStr.includes('bubble');

    if (isPet) {
        newCat = 'Pet Supplies';
    } else if (isKids) {
        newCat = 'Baby & Kids Toys';
    } else if (isFashion) {
        newCat = 'Apparel & Fashion';
    } else if (isBeauty) {
        newCat = 'Beauty & Skincare';
    } else if (isFitness) {
        newCat = 'Fitness & Health';
    } else if (isGadget) {
        newCat = 'Smart Gadgets';
    } else if (isHome) {
        newCat = 'Home & Kitchen';
    } else if (isPhoneAccessory) {
        newCat = 'Phone Accessories';
    } else if (isElectronics) {
        newCat = 'Electronics'; // Or Smart gadgets, but prompt specifically asked for Earbuds, Smart watches, Power Banks, Chargers in Electronics
    }

    // Overrides
    if (nameStr.includes('earbud') || nameStr.includes('smart watch') || nameStr.includes('smartwatch') || nameStr.includes('power bank') || nameStr.includes('charger') && !nameStr.includes('phone')) {
        newCat = 'Electronics';
    }
    if (nameStr.includes('phone case') || nameStr.includes('screen protector') || nameStr.includes('cable') || nameStr.includes('phone holder') || nameStr.includes('phone charger') || nameStr.includes('magsafe')) {
        newCat = 'Phone Accessories';
    }
    if (nameStr.includes('anti theft')) {
        newCat = 'Home & Kitchen';
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
