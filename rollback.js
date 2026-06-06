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
  console.log("Connected to DB for rollback.");

  const products = await Product.find({ name: { $in: [
    'Winter Peach Butt Yoga Pants Thickened',
    'Off Shoulder Top And Pants Womens',
    'Wide Leg Straight Leg Casual All Matching Long Pants With Pockets'
  ] }});

  for(const p of products) {
    p.category = 'Apparel & Fashion';
    await p.save();
    console.log("Rolled back", p.name);
  }

  process.exit();
}
run();
