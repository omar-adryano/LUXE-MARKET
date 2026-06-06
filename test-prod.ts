import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const p = await Product.findOne({ name: /Performance Footwear Classic/i });
  console.log('Product Found:', !!p);
  if (p) console.log('ID:', p._id, 'id:', (p as any).id);
  
  const all = await Product.find().limit(3);
  console.log('Sample products:', all.map(x => ({ _id: x._id, id: (x as any).id, name: x.name })));
  process.exit(0);
}
run();
