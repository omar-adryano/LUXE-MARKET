import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function listAll() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const products = await Product.find({ name: /case|cable|mount|charger|charge|phone|screen/i });
  console.log('--- POTENTIAL PHONE ACCESSORIES ---');
  products.forEach(p => console.log(`[${p.category}] ${p.name}`));

  const elec = await Product.find({ name: /earbud|headphone|speaker|watch|watch|camera|electronic/i });
  console.log('--- POTENTIAL ELECTRONICS ---');
  elec.forEach(p => console.log(`[${p.category}] ${p.name}`));
  
  await mongoose.disconnect();
}
listAll();
