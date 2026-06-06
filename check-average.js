import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const products = await db.collection('products').find({ source: 'cj' }).toArray();
  
  let totalAfter = 0;
  for (let p of products) {
     totalAfter += (p.price || 0);
  }

  console.log(`Average final price across ${products.length} products: ${(totalAfter / products.length).toFixed(2)}`);
  process.exit();
}
run();
