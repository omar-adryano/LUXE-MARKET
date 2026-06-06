import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const db = mongoose.connection.db;
  const p = await db.collection('products').findOne({ source: 'cj' });

  console.log(JSON.stringify(p, null, 2));

  process.exit(0);
}

run();
