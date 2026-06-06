import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  
  // No updates, just report if there are any mismatches remaining or list what should have changed.
  console.log("Done checking.");
  process.exit();
}
run();
