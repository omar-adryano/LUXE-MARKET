import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function cleanupAgain() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({ category: 'Smart Gadgets' });
  let validCount = 0;

  for (const p of products) {
      const name = p.name ? p.name.toLowerCase() : '';
      if (
          name.includes('cardigan') || 
          name.includes('blouse') || 
          name.includes('extractor') || 
          name.includes('tile cutter') || 
          name.includes('apparel') || 
          name.includes('clothing') ||
          name.includes('pants') ||
          name.includes('trousers') ||
          name.includes('shirt')
      ) {
          console.log(`Deleting ${p.name}`);
          await Product.deleteOne({ _id: p._id });
      } else {
        validCount++;
      }
  }

  console.log(`Total remaining gadgets: ${validCount}`);
  process.exit(0);
}
cleanupAgain();
