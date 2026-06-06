import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function fixCat() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  
  for (const p of products) {
    let currCat = p.category;
    let newCat = currCat;
    const nameStr = (p.name || '').toLowerCase();

    // Revert some cases
    if (nameStr.includes('happy spring toy cat teaser ball')) {
       newCat = 'Pet Supplies';
    }
    if (nameStr.includes('monitoring')) {
       newCat = 'Electronics'; // Security camera?
    }
    if (nameStr.includes('caster wheel')) {
       newCat = 'Home & Kitchen';
    }
    
    // Also move the remaining Electronics to Smart Gadgets or Home & Kitchen if they are completely out of place?
    // Wait, the prompt just said:
    // "Ensure category pages display relevant products and customers never see jewelry inside Electronics"

    if (newCat !== currCat) {
       console.log(`Reverting: "${p.name}" to [${newCat}]`);
       p.category = newCat;
       await p.save();
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

fixCat();
