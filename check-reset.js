import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  
  const db = mongoose.connection.db;
  const cjTotal = await db.collection('products').countDocuments({ source: 'cj' });
  const cjReset = await db.collection('products').countDocuments({ source: 'cj', priceReset: true });
  
  console.log(`Total CJ products: ${cjTotal}`);
  console.log(`Products reset: ${cjReset}`);
  
  const notReset = await db.collection('products').findOne({ source: 'cj', priceReset: { $ne: true }});
  if(notReset) console.log("Example not reset name:", notReset.name, "ID:", notReset.aliexpressProductId);

  process.exit();
}
run();
