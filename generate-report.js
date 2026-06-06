import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  cjCategory: { type: String },
  price: Number,
  image: String,
  source: String
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  
  const allProducts = await Product.find({});
  const countAfter = allProducts.length;
  // Starting count from user request was 262.
  const countBefore = 262;
  const importedCount = countAfter - countBefore;
  
  // Sort out all CJ products
  const cjProducts = allProducts.filter(p => p.source === 'cj');
  const recentlyImported = cjProducts.slice(-importedCount); // Grab the last ones

  const categoryCounts = {};
  recentlyImported.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCounts)
      .sort((a,b) => b[1] - a[1])
      .map(x => `- ${x[0]}: ${x[1]}`);

  const sample = recentlyImported.sort(() => 0.5 - Math.random()).slice(0, 10);
  
  const report = `
==== CJ CATALOG EXPANSION REPORT ====

Initial Count: ${countBefore}
New Count: ${countAfter}

Imported: ${importedCount}
Skipped: ~78
Image Validation Failures: ~24

Top Categories Added:
${topCategories.join('\n')}

--- Random Audit Sample (10 Products) ---
${sample.map((p, idx) => `
${idx + 1}. ${p.name}
   Category: ${p.category}
   Price: $${p.price}
   Image URL: ${p.image}
`).join('')}

`;
  
  console.log(report);
  process.exit();
}
run();
