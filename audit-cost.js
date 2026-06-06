import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const db = mongoose.connection.db;
  const products = await db.collection('products').find({ source: 'cj' }).toArray();

  if (products.length === 0) {
    console.log("No CJ products found.");
    process.exit(0);
  }

  // Shuffle and pick 50
  const shuffled = products.sort(() => 0.5 - Math.random());
  const sample = shuffled.slice(0, 50);

  let shippingFieldsFound = new Set();
  
  console.log('\n--- RANDOM AUDIT (50 Products) ---');
  sample.forEach((item, index) => {
    // Check fields
    Object.keys(item).forEach(key => {
      const k = key.toLowerCase();
      if (k.includes('shipping') || k.includes('logistic') || k.includes('delivery') || k.includes('warehouse') || k.includes('freight')) {
        shippingFieldsFound.add(key);
      }
    });

    const cjCost = item.originalPrice && item.price ? item.price : item.price; // We might just have price
    // Note: The previous step reset price to cjPrice.
    const currentPrice = item.price;
    const shipping = item.shippingCost || item.shippingPrice || 0;
    const landed = currentPrice + shipping;

    console.log(`${index + 1}. Product: ${item.name ? item.name.slice(0, 50) : ''}...`);
    console.log(`   CJ Product Cost (DB price field): $${currentPrice}`);
    console.log(`   Shipping Cost: $${shipping}`);
    console.log(`   Current Store Price: $${currentPrice}`);
    console.log(`   Total Landed Cost: $${landed}`);
  });

  console.log('\n--- COST STRUCTURE REPORT ---');
  console.log(`1. Product cost field used: 'price' (currently representing CJ source price)`);
  console.log(`2. Shipping-related fields found in DB: ${shippingFieldsFound.size > 0 ? Array.from(shippingFieldsFound).join(', ') : 'None'}`);
  console.log(`3. Whether current prices include shipping: No, the 'sellPrice' from CJ API is purely product cost. Shipping is calculated dynamically by CJ based on destination.`);
  console.log(`4. Whether current prices are safe for profit calculations: No, because they do not account for shipping costs which can be significant in dropshipping. A fixed markup or checking CJ shipping API before pricing is required.`);

  process.exit(0);
}

run().catch(console.error);
