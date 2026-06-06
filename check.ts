import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function listCats() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let obj: any = {};
  for(const p of products) {
    if(!obj[p.category]) obj[p.category] = 0;
    obj[p.category]++;
  }
  
  for(const cat in obj) {
     console.log(`- ${cat}: ${obj[cat]}`);
  }

  console.log('\nElectronics items:');
  const elecs = products.filter(p => p.category === 'Electronics');
  elecs.forEach(p => console.log(p.name));

  await mongoose.disconnect();
  process.exit(0);
}

listCats();
