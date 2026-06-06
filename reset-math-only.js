import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const products = await db.collection('products').find({ source: 'cj' }).toArray();
  
  let resetCount = 0;
  let skipCount = 0;
  let totalPriceBefore = 0;
  let totalPriceAfter = 0;
  const auditList = [];

  for (let p of products) {
    let currentPrice = p.price || 0;
    totalPriceBefore += currentPrice;

    // Use exact inverse formula
    let cjPrice = Number(((currentPrice - 0.99) / 3).toFixed(2));
    
    // Safety boundaries for extremely low items not hitting pattern
    if(cjPrice <= 0 || isNaN(cjPrice)) {
       if (p.originalPrice) {
          cjPrice = Number(((p.originalPrice - 0.99) / 4).toFixed(2)); 
       }
       if (cjPrice <= 0 || isNaN(cjPrice)) cjPrice = currentPrice;
    }

    if (cjPrice > 0 && Math.abs(cjPrice - currentPrice) > 0.05) {
       await db.collection('products').updateOne(
         { _id: p._id },
         { $set: { price: cjPrice, originalPrice: Number((cjPrice * 1.5).toFixed(2)) } } 
       );
       resetCount++;
       totalPriceAfter += cjPrice;

       auditList.push({
         name: p.name,
         currentPrice: currentPrice,
         cjPrice: cjPrice,
         finalPrice: cjPrice
       });
    } else {
       skipCount++;
       totalPriceAfter += currentPrice;
    }
  }

  console.log('--- PRICING RESET REPORT ---');
  console.log(`Total CJ products: ${products.length}`);
  console.log(`Products reset: ${resetCount}`);
  console.log(`Products skipped: ${skipCount}`);
  console.log(`Average price before reset: ${(totalPriceBefore / products.length).toFixed(2)}`);
  console.log(`Average price after reset: ${(totalPriceAfter / products.length).toFixed(2)}`);

  console.log('\n--- RANDOM AUDIT (20 Products) ---');
  const shuffled = auditList.sort(() => 0.5 - Math.random());
  const auditSample = shuffled.slice(0, 20);
  
  auditSample.forEach((item, index) => {
    console.log(`${index + 1}. Product Name: ${item.name.slice(0, 50)}...`);
    console.log(`   Current Price (Before): $${item.currentPrice}`);
    console.log(`   Original CJ Price: $${item.cjPrice}`);
    console.log(`   Final Reset Price: $${item.finalPrice}`);
  });

  process.exit(0);
}

run();
