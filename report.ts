import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const total = await Product.countDocuments();
  const cj = await Product.countDocuments({source: 'cj'});
  
  const pipeline = [
    { $match: { source: 'cj' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  
  const categories = await Product.aggregate(pipeline);
  console.log('Categories:', categories);
  
  console.log('Total:', total, 'CJ:', cj);
  
  const samples = await Product.find({ source: 'cj' }).sort({ _id: -1 }).limit(10);
  console.log('SAMPLE PRODUCTS:');
  samples.forEach(s => {
    const discount = Math.round(((s.originalPrice - s.price) / s.originalPrice) * 100);
    console.log('- [' + s.category + '] ' + s.name.substring(0, 30) + '... | Orig: $' + s.originalPrice + ' | Sale: $' + s.price + ' (' + discount + '% OFF)');
    console.log('  Image: ' + s.image);
  });
  
  await mongoose.disconnect();
}
run();
