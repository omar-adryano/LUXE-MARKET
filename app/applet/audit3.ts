import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let beforeCounts: Record<string, number> = {};
  
  for (const p of products) {
     if (!beforeCounts[p.category]) beforeCounts[p.category] = 0;
     beforeCounts[p.category]++;
  }

  console.log('\n--- CURRENT CATEGORY COUNTS ---');
  for (const [cat, count] of Object.entries(beforeCounts)) {
    console.log(`- ${cat}: ${count}`);
  }

  console.log('\n--- INVESTIGATING ELECTRONICS ---');
  const elec = products.filter(p => p.category === 'Electronics');
  for (const p of elec) {
      console.log(p.name);
  }

  await mongoose.disconnect();
  process.exit(0);
}

audit();
