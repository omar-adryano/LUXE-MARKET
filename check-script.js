import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  cjCategory: { type: String },
  source: { type: String },
  price: Number,
  image: String
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const allProducts = await Product.find({});
  const count = allProducts.length;
  const cjCount = allProducts.filter(p => p.source === 'cj').length;
  
  console.log(`Total products: ${count}`);
  console.log(`CJ products: ${cjCount}`);
  
  if (cjCount > 0) {
      console.log('Sample of last 5 imported CJ products:');
      const sample = allProducts.filter(p => p.source === 'cj').slice(-5);
      sample.forEach((p, idx) => {
         console.log(`${idx + 1}. ${p.name}`);
         console.log(`   Category: ${p.category}`);
         console.log(`   CJ Category: ${p.cjCategory}`);
         console.log(`   Price: $${p.price}`);
         console.log(`   Image URL: ${p.image}\n`);
      });
  }
  
  process.exit();
}
run();
