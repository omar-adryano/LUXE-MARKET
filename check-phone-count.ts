import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function checkCount() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const finalCount = await Product.countDocuments();
  console.log(`Final product count: ${finalCount}`);
  
  const phoneAccCount = await Product.countDocuments({ category: 'Phone Accessories' });
  console.log(`Phone Accessories count: ${phoneAccCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

checkCount();
