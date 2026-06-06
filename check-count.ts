import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const cjCount = await Product.countDocuments({source: 'cj'});
  console.log('Total CJ:', cjCount);
  await mongoose.disconnect();
}
check();
