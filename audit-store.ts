import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function auditCategories() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let movedCount = 0;
  let misclassifiedFound = 0;
  let afterCounts: Record<string, number> = {};
  const sampleProducts: Record<string, string[]> = {};

  for (const p of products) {
    let currCat = p.category;
    let newCat = currCat;
    const nameStr = (p.name || '').toLowerCase();

    // Pet
    if (nameStr.includes('dog') || nameStr.includes('cat ') || nameStr.includes('pet ') && !nameStr.includes('petals') || nameStr.includes('litter')) {
      newCat = 'Pet Supplies';
    } 
    // Beauty & Skincare
    else if (nameStr.includes('beauty') || nameStr.includes('skin') || nameStr.includes('serum') || nameStr.includes('moisturizing') || nameStr.includes('cream') || nameStr.includes('hair') && !nameStr.includes('chair') || nameStr.includes('makeup') || nameStr.includes('soap') || nameStr.includes('gummies') || nameStr.includes('supplement') || nameStr.includes('enhancement') || nameStr.includes('stick') && !nameStr.includes('bubble') || nameStr.includes('mask') || nameStr.includes('tooth powder') || nameStr.includes('eye-washing')) {
      newCat = 'Beauty & Skincare';
    }
    // Fashion
    else if (nameStr.includes('dress') || nameStr.includes('jacket') || nameStr.includes('boot') || nameStr.includes('shoe') || nameStr.includes('shirt') || nameStr.includes('pant') || nameStr.includes('clothes') || nameStr.includes('apparel') || nameStr.includes('skirt') || nameStr.includes('bra') || nameStr.includes('mens set') || nameStr.includes('pumps') || nameStr.includes('slippers') || nameStr.includes('socks') || nameStr.includes('jumpsuit') || nameStr.includes('ring') && !nameStr.includes('light') && !nameStr.includes('smart') || nameStr.includes('necklace') || nameStr.includes('earring') || nameStr.includes('bracelet') || nameStr.includes('fashion') || nameStr.includes('jewelry') || nameStr.includes('bag') && !nameStr.match(/waist bag|storage bag|garbage|trash|sleeping/) || nameStr.includes('wallet')) {
      newCat = 'Apparel & Fashion';
    }
    // Electronics
    else if (nameStr.includes('earbud') || nameStr.includes('headphone') || nameStr.includes('speaker') || nameStr.includes('smartwatch') || nameStr.includes('smart watch') || nameStr.includes('camera') || nameStr.includes('electronic device')) {
      newCat = 'Electronics';
    }
    // Gadgets
    else if (nameStr.includes('drone') || nameStr.includes('tech gadget') || nameStr.includes('smart home') || nameStr.includes('usb gadget') || nameStr.includes('innovative') && nameStr.includes('electronic') || nameStr.includes('led strip lights')) {
      newCat = 'Smart Gadgets';
    }
    // Phone Accessories
    else if (nameStr.includes('case') && nameStr.includes('iphone') || nameStr.includes('phone') && !nameStr.includes('microphone') || nameStr.includes('screen protector') || nameStr.includes('cable') || nameStr.includes('charger') && !nameStr.includes('smart') || nameStr.includes('magsafe') || nameStr.includes('car mount') || nameStr.includes('power bank') || nameStr.includes('charging battery')) {
      newCat = 'Phone Accessories';
    }
    // Home & Kitchen
    else if (nameStr.includes('home') || nameStr.includes('kitchen') || nameStr.includes('cushion') || nameStr.includes('clean') || nameStr.includes('trash') || nameStr.includes('mug') || nameStr.includes('board') || nameStr.includes('bed') || nameStr.includes('light') || nameStr.includes('cup') || nameStr.includes('velcro ready finished') || nameStr.includes('garden')) {
      newCat = 'Home & Kitchen';
    }
    // Fitness & Health
    else if (nameStr.includes('fitness') || nameStr.includes('yoga') || nameStr.includes('workout') || nameStr.includes('sport') || nameStr.includes('run') && !nameStr.includes('running the') || nameStr.includes('golf')) {
      newCat = 'Fitness & Health';
    }

    if (newCat !== currCat) {
      console.log(`Misclassified: [${currCat}] ${p.name} -> [${newCat}]`);
      misclassifiedFound++;
      movedCount++;
      p.category = newCat;
      await p.save();
    }

    if (!afterCounts[newCat]) afterCounts[newCat] = 0;
    afterCounts[newCat]++;
    
    if (!sampleProducts[newCat]) sampleProducts[newCat] = [];
    if (sampleProducts[newCat].length < 3) {
      sampleProducts[newCat].push(p.name);
    }
  }

  console.log('\n--- REPORT ---');
  console.log(`Total products audited: ${products.length}`);
  console.log(`Misclassified products found: ${misclassifiedFound}`);
  console.log(`Products moved: ${movedCount}`);
  
  console.log('\nFinal category counts:');
  for (const [cat, count] of Object.entries(afterCounts)) {
    console.log(` - ${cat}: ${count}`);
    console.log(`   Samples: ${sampleProducts[cat].join(' | ')}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

auditCategories();
