import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const products = await Product.find({});
  let beforeCounts = {};
  let afterCounts = {};
  
  for(const p of products) {
    if(!beforeCounts[p.category]) beforeCounts[p.category] = 0;
    beforeCounts[p.category]++;
  }

  const report = [];
  let correctedCount = 0;
  let remainingCount = 0;

  for(const p of products) {
    const n = (p.name || '').toLowerCase();
    let currentCat = p.category;
    let newCat = currentCat;
    let confidence = 'LOW';
    let reason = '';

    if (n.includes('sneaker') || n.includes('shoe') || n.includes('boot') || n.includes('pump') || n.includes('sandal') || n.includes('shirt') || n.includes('dress') || n.includes('coat') || n.includes('suit') || n.includes('jacket') || n.includes('swimsuit')) {
       newCat = 'Apparel & Fashion';
       reason = 'Name indicates clothing/footwear (Apparel & Fashion)';
       confidence = 'HIGH';
    } else if (n.includes('headphone') || n.includes('earphone') || n.includes('earbud') || n.includes('speaker') || n.includes('microphone')) {
       newCat = 'Electronics';
       reason = 'Name indicates audio equipment (Electronics)';
       confidence = 'HIGH';
    } else if (n.includes('phone case') || n.includes('screen protector') || n.includes('phone holder')) {
       newCat = 'Phone Accessories';
       reason = 'Name indicates mobile accessory (Phone Accessories)';
       confidence = 'HIGH';
    } else if (n.includes('ring') || n.includes('necklace') || n.includes('bracelet') || n.includes('earring') || n.includes('jewelry') || (n.includes('watch') && !n.includes('smartwatch'))) {
       newCat = 'Jewelry & Watches';
       reason = 'Name indicates worn accessories/jewelry (Jewelry & Watches)';
       confidence = 'HIGH';
    } else if (n.includes('serum') || n.includes('cream') || n.includes('lotion') || n.includes('makeup') || n.includes('skincare') || n.includes('cleanser')) {
       newCat = 'Beauty & Skincare';
       reason = 'Name indicates beauty care product (Beauty & Skincare)';
       confidence = 'HIGH';
    } else if (n.includes('kitchen') || n.includes('cookware') || n.includes('mug') || n.includes('plate') || n.includes('bowl') || n.includes('cleaner') || n.includes('mop') || n.includes('vacuum') || n.includes('sofa') || n.includes('furniture') || n.includes('cup') || n.includes('pan')) {
       newCat = 'Home & Kitchen';
       reason = 'Name indicates household item or furniture (Home & Kitchen)';
       confidence = 'HIGH';
    } else if (n.includes('pet') || n.includes('dog') || n.includes('cat') || n.includes('leash')) {
       newCat = 'Pet Supplies';
       reason = 'Name indicates animal supply (Pet Supplies)';
       confidence = 'HIGH';
    } else if (n.includes('chair') || n.includes('table') || n.includes('lamp') || n.includes('throw')) {
       newCat = 'Home & Kitchen';
       reason = 'Name indicates household furniture (Home & Kitchen)';
       confidence = 'HIGH';
    } else if (n.includes('smart') && n.includes('watch')) {
       newCat = 'Smart Gadgets';
       reason = 'Name indicates smart watch (Smart Gadgets)';
       confidence = 'HIGH';
    } else if (n.includes('camera') || n.includes('drone')) {
       newCat = 'Electronics';
       reason = 'Name indicates electronics';
       confidence = 'HIGH';
    }

    if (currentCat !== newCat && confidence === 'HIGH') {
       report.push(`Product Name: ${p.name}\nCurrent Category: ${currentCat}\nRecommended Category: ${newCat}\nReason: ${reason}\n`);
       p.category = newCat;
       await p.save();
       correctedCount++;
    } else if (currentCat !== newCat) {
       report.push(`Product Name: ${p.name}\nCurrent Category: ${currentCat}\nRecommended Category: ${newCat}\nReason: ${reason} (LOW CONFIDENCE - SKIPPING)\n`);
       remainingCount++;
    }

    if(!afterCounts[p.category]) afterCounts[p.category] = 0;
    afterCounts[p.category]++;
  }

  console.log(`
==== CATEGORY AUDIT REPORT ====
Products audited: ${products.length}
Products corrected: ${correctedCount}
Products left unchanged (low confidence mismatch): ${remainingCount}

Category counts before:
${JSON.stringify(beforeCounts, null, 2)}

Category counts after:
${JSON.stringify(afterCounts, null, 2)}

---- CORRECTION DETAILS ----
${report.join('\n')}
`);

  process.exit();
}
run();
