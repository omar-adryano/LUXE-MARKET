import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function auditCategories() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let beforeCounts: Record<string, number> = {};
  let afterCounts: Record<string, number> = {};
  let movedCount = 0;
  let misclassifiedFound = 0;
  const sampleProducts: Record<string, string[]> = {};

  for (const p of products) {
    if (!beforeCounts[p.category]) beforeCounts[p.category] = 0;
    beforeCounts[p.category]++;

    let currCat = p.category;
    let newCat = currCat;
    const nameStr = (p.name || '').toLowerCase();
    const descStr = (p.description || '').toLowerCase();

    // Check for fashion items
    const isFashion = 
      nameStr.includes('dress') || 
      nameStr.includes('jacket') || 
      nameStr.includes('boot') || 
      nameStr.includes('shoe') ||
      nameStr.includes('shirt') ||
      nameStr.includes('pant') ||
      nameStr.includes('clothes') ||
      nameStr.includes('bag') && !nameStr.match(/waist bag|storage bag|garbage|trash/) ||
      nameStr.includes('necklace') ||
      nameStr.includes('earring') ||
      nameStr.includes('ring') && !nameStr.includes('light') && !nameStr.includes('smart') ||
      nameStr.includes('bracelet');

    const isPhoneAccessory = 
      nameStr.includes('case') && nameStr.includes('iphone') ||
      nameStr.includes('phone') && !nameStr.includes('microphone') ||
      nameStr.includes('screen protector') ||
      nameStr.includes('cable') ||
      nameStr.includes('charger') && !nameStr.includes('smart') ||
      nameStr.includes('magsafe');

    const isElectronics = 
      nameStr.includes('earbud') ||
      nameStr.includes('headphone') ||
      nameStr.includes('speaker') ||
      nameStr.includes('power bank') ||
      nameStr.includes('smartwatch') ||
      nameStr.includes('smart watch');

    const isGadget =
      nameStr.includes('drone') ||
      nameStr.includes('camera') ||
      nameStr.includes('projector') ||
      nameStr.includes('smart') && !nameStr.includes('watch') && !nameStr.includes('phone');

    if (isFashion && !isPhoneAccessory && !isElectronics && !isGadget) {
        newCat = 'Apparel & Fashion';
    } else if (isElectronics) {
        newCat = 'Electronics';
    } else if (isPhoneAccessory) {
        newCat = 'Phone Accessories';
    } else if (isGadget) {
        newCat = 'Smart Gadgets';
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
