import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function listAll() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let obj: any = {};
  for(const p of products) {
    if(!obj[p.category]) obj[p.category] = [];
    obj[p.category].push(p.name);
  }
  
  for(const cat in obj) {
     console.log(`\n=== ${cat} (${obj[cat].length}) ===`);
     for(let i=0; i<Math.min(5, obj[cat].length); i++) {
        console.log(obj[cat][i]);
     }
  }

  await mongoose.disconnect();
  process.exit(0);
}

listAll();
