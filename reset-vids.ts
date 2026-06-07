import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
  const prods = await Product.find({ vid: { $in: ['NO_VID_FOUND', 'RATE_LIMIT_OR_ERROR'] } });
  console.log(`Found ${prods.length} products with ERROR vids`);
  for(const p of prods) {
      console.log(`${p.name} - ${p.vid}`);
      p.vid = ''; // reset them!
      await p.save();
  }
  process.exit();
}
check();
