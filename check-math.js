import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  
  const db = mongoose.connection.db;

  const sampleNotReset = await db.collection('products').find({ source: 'cj', priceReset: { $ne: true } }).limit(5).toArray();

  for (let p of sampleNotReset) {
      let calc = Number(((p.price - 0.99) / 3).toFixed(2));
      console.log(`Fake storefront price: ${p.price} | Derived CJ Price: ${calc} | Fake Original Price: ${p.originalPrice}`);
  }

  process.exit();
}
run();
