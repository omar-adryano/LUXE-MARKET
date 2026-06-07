
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.ts';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const count = await Product.countDocuments({ source: 'cj', vid: { $exists: true, $ne: '' } });
  console.log('Total CJ Products with VID:', count);
  process.exit(0);
}
run();
