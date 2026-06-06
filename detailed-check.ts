import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function checkDetailed() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 15 * 60 * 1000); 

  const recentCount = await Product.countDocuments({ 
     category: 'Phone Accessories',
     createdAt: { $gte: fiveMinAgo }
  });

  console.log(`Phone Accessories recently added: ${recentCount}`);
  
  const totalCat = await Product.countDocuments({ category: 'Phone Accessories' });
  console.log(`Total Phone Accessories now: ${totalCat}`);

  const totalProds = await Product.countDocuments();
  console.log(`Total products now: ${totalProds}`);

  await mongoose.disconnect();
  process.exit(0);
}

checkDetailed();
