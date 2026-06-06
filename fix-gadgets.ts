import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({ category: 'Smart Gadgets' });
  let validCount = 0;
  for (const p of products) {
      const name = p.name ? p.name.toLowerCase() : '';
      if (name.includes('sandal') || name.includes('bracelet') || name.includes('sweater') || name.includes('dress') || 
          name.includes('mower') || name.includes('shoes') || name.includes('jewelry') || name.includes('t-shirt') || 
          name.includes('skirt') || name.includes('gala') || name.includes('nightgown') || name.includes('letter') || name.includes('dispenser') || name.includes('thermometer')) {
          console.log(`Deleting ${p.name}`);
          await Product.deleteOne({ _id: p._id });
      } else {
          console.log(`Keeping ${p.name}`);
          validCount++;
      }
  }

  console.log(`Total genuine smart gadgets: ${validCount}`);
  process.exit(0);
}
fix();
