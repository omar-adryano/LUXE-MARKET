import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const productSchema = new mongoose.Schema({
  name: { type: String },
  category: { type: String },
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  
  const sneakers = await Product.find({ name: /urban minimalist sneaker/i });
  console.log("DB Matches for 'Urban Minimalist Sneakers':", sneakers);

  process.exit();
}
run();
