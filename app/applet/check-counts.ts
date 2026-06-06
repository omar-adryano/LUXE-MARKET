import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const allProducts = await Product.find({});
  const count = allProducts.length;
  const cjCount = allProducts.filter(p => p.source === 'cj').length;
  
  console.log(`Total products: ${count}`);
  console.log(`CJ products: ${cjCount}`);
  process.exit();
}
run();
