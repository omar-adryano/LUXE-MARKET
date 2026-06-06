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

    const exactWords = n.split(/[\s,]+/); // better matching

    if (exactWords.some(w => ['sneaker', 'sneakers', 'shoe', 'shoes', 'boot', 'boots', 'pump', 'pumps', 'sandal', 'sandals', 'shirt', 'shirts', 'dress', 'dresses', 'coat', 'coats', 'suit', 'suits', 'jacket', 'jackets', 'swimsuit', 'apparel', 'pants'].includes(w))) {
       newCat = 'Apparel & Fashion';
       reason = 'Name indicates apparel/footwear';
       confidence = 'HIGH';
    } else if (exactWords.some(w => ['headphone', 'headphones', 'earphone', 'earphones', 'earbud', 'earbuds', 'speaker', 'speakers', 'microphone'].includes(w))) {
       newCat = 'Electronics';
       reason = 'Name indicates electronics audio';
       confidence = 'HIGH';
    } else if (exactWords.some(w => ['ring', 'rings', 'necklace', 'necklaces', 'bracelet', 'bracelets', 'earring', 'earrings', 'jewelry'].includes(w))) {
       newCat = 'Jewelry & Watches';
       reason = 'Name indicates jewelry';
       confidence = 'HIGH';
    } else if (exactWords.includes('watch') && !n.includes('smart')) {
       newCat = 'Jewelry & Watches';
       reason = 'Name indicates watch';
       confidence = 'HIGH';
    } else if (exactWords.some(w => ['skincare', 'serum', 'lotion', 'makeup', 'cleanser', 'cosmetics', 'moisturizer'].includes(w))) {
       newCat = 'Beauty & Skincare';
       reason = 'Name indicates beauty product';
       confidence = 'HIGH';
    } else if (exactWords.some(w => ['pet', 'dog', 'cat', 'leash'].includes(w))) {
       newCat = 'Pet Supplies';
       reason = 'Name indicates pet supply';
       confidence = 'HIGH';
    } else if (exactWords.some(w => ['chair', 'table', 'lamp', 'throw', 'furniture', 'sofa', 'desk', 'plate', 'mug', 'cup'].includes(w))) {
       newCat = 'Home & Kitchen';
       reason = 'Name indicates home product';
       confidence = 'HIGH';
    } else if (n.includes('smart') && n.includes('watch')) {
       newCat = 'Smart Gadgets';
       reason = 'Smart watch';
       confidence = 'HIGH';
    } else if (exactWords.some(w => ['camera', 'drone'].includes(w))) {
       newCat = 'Electronics';
       reason = 'Camera or drone';
       confidence = 'HIGH';
    }

    if (currentCat !== newCat && confidence === 'HIGH') {
       report.push(`Product Name: ${p.name}\nCurrent Category: ${currentCat} -> ${newCat} (${reason})`);
       p.category = newCat;
       await p.save();
       correctedCount++;
    } else if (currentCat !== newCat && confidence === 'LOW') {
       report.push(`Product Name: ${p.name}\nCurrent Category: ${currentCat} -> ${newCat} (LOW CONFIDENCE)`);
       remainingCount++;
    }

    if(!afterCounts[p.category]) afterCounts[p.category] = 0;
    afterCounts[p.category]++;
  }

  console.log(`
==== FINAL AUDIT SUMMARY ====
Products audited: ${products.length}
Products corrected (this run): ${correctedCount}
Products left unchanged (questionable): ${remainingCount}

Counts Before:
${JSON.stringify(beforeCounts, null, 2)}

Counts After:
${JSON.stringify(afterCounts, null, 2)}
`);
  process.exit();
}
run();
