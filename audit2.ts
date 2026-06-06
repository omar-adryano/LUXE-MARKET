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
    
    // Check for Jewelry/Fashion in Electronics
    if (nameStr.includes('ring') || nameStr.includes('necklace') || nameStr.includes('bracelet') || nameStr.includes('earring') || nameStr.includes('jewelry') || nameStr.includes('silver') || nameStr.includes('gold') || nameStr.includes('zircon') || nameStr.includes('pendant')) {
      if (!nameStr.includes('smart ring') && !nameStr.includes('ring light') && !nameStr.includes('key ring')) { 
        newCategory = 'Fashion & Accessories';
      }
    }
    
    // Check if it's Phone Accessories
    if (nameStr.includes('phone case') || nameStr.includes('screen protector') || nameStr.includes('magsafe') || nameStr.includes('iphone') || nameStr.includes('samsung case') || nameStr.includes('charger') || nameStr.includes('cable') || nameStr.includes('power bank') || nameStr.includes('phone holder') || nameStr.includes('tripod') || nameStr.includes('selfie stick') || nameStr.includes('cooling fan')) {
      newCategory = 'Phone Accessories';
    } else if (nameStr.includes('smart') || nameStr.includes('drone') || nameStr.includes('speaker') || nameStr.includes('earbuds') || nameStr.includes('headphone') || nameStr.includes('watch')) {
      newCategory = 'Smart Gadgets';
    } else if (nameStr.includes('kitchen') || nameStr.includes('home') || nameStr.includes('mug') || nameStr.includes('coffee') || nameStr.includes('decor')) {
      newCategory = 'Home & Kitchen';
    } else if (nameStr.includes('beauty') || nameStr.includes('skin') || nameStr.includes('face') || nameStr.includes('hair') || nameStr.includes('nail') || nameStr.includes('makeup')) {
      if (!nameStr.includes('hair dryer') && !nameStr.includes('curling iron')) {
         newCategory = 'Beauty & Skincare';
      } else {
         newCategory = 'Electronics'; // or Beauty
      }
    } else if (nameStr.includes('pet') || nameStr.includes('dog') || nameStr.includes('cat') || nameStr.includes('toy')) {
      newCategory = 'Pet Supplies';
    } else if (nameStr.includes('fitness') || nameStr.includes('workout') || nameStr.includes('gym') || nameStr.includes('yoga') || nameStr.includes('sport')) {
      newCategory = 'Fitness & Health';
    }

    if (newCategory !== p.category) {
       // Make sure we only change if it's actually misclassified or if it gives a better category.
       // Actually wait, let's look at misclassifications first. 
       // I'll log all the products to see where they currently are and what the proposed category is
    }

    // if (!afterCounts[p.category]) afterCounts[p.category] = 0;
    // afterCounts[p.category]++;
  }

  // ....
  
  await mongoose.disconnect();
  process.exit(0);
}

audit();
