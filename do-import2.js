import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  cjCategory: { type: String },
  price: Number,
  image: String,
  source: String,
  aliexpressProductId: String,
  aliexpressUrl: String,
  stock: Number,
  description: String,
  thumbnails: [String]
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

async function getAccessToken() {
    const email = process.env.CJ_API_EMAIL;
    const apiKey = process.env.CJ_API_KEY;
    const response = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: apiKey }),
    });
    const data = await response.json();
    return data.data.accessToken;
}

async function getProductsList(token, page) {
    const response = await fetch(`${BASE_URL}/product/list?pageNum=${page}&pageSize=50`, {
        headers: { 'CJ-Access-Token': token }
    });
    const data = await response.json();
    return data.data?.list || data.data || [];
}

async function getProductInfo(token, pid) {
    const response = await fetch(`${BASE_URL}/product/query?pid=${pid}`, {
        headers: { 'CJ-Access-Token': token }
    });
    const data = await response.json();
    return data.data;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const allProducts = await Product.find({});
  const countBefore = allProducts.length;
  // Let's cap at 362 (262 + 100)
  const required = Math.max(0, 362 - countBefore);
  console.log(`Need to import ${required} more products.`);
  if (required === 0) {
      console.log("We are done. Generating final report.");
      // Will just exit
  }

  let importedCount = 0;
  let skippedCount = 0;
  let imageFailedCount = 0;
  
  // Starting from a higher page to avoid already checked
  let page = Math.floor(allProducts.filter(p => p.source === 'cj').length / 50) + 5; 
  let importedCjProducts = [];
  const categoryCounts = {};
  
  const token = await getAccessToken();

  while (importedCount < required) {
    console.log(`Fetching page ${page}...`);
    let list = await getProductsList(token, page);
    
    if (!list || list.length === 0) {
       console.log("No more products.");
       break;
    }

    for (const item of list) {
       if (importedCount >= required) break;
       
       const pid = item.pid || item.productId || item.id;
       if (!pid) { skippedCount++; continue; }

       const existing = await Product.findOne({ aliexpressProductId: pid });
       if (existing) { skippedCount++; continue; }

       let info;
       try {
         info = await getProductInfo(token, pid);
       } catch(e) {
         skippedCount++; continue;
       }

       if (!info || !info.productNameEn) { skippedCount++; continue; }

       let p = 0;
       if (info.sellPrice) p = Number(info.sellPrice);
       else if (info.variants && info.variants.length > 0) p = Number(info.variants[0].variantSellPrice) || Number(info.variants[0].sellPrice) || 0;
       if (!(p > 0)) { skippedCount++; continue; }
       
       let salePrice = (p * 3 < 4.99) ? 4.99 : p * 3;
       salePrice = Math.floor(salePrice) + 0.99;
       
       let listedNum = Number(info.listedNum);
       if (isNaN(listedNum) || listedNum <= 0) listedNum = 100;

       let finalImage = info.productImageSet?.[0] || info.bigImage || '';
       if (!finalImage && info.productImage) {
         try {
           const parsed = JSON.parse(info.productImage);
           if (Array.isArray(parsed) && parsed.length > 0) finalImage = parsed[0];
           else if (typeof parsed === 'string') finalImage = parsed;
         } catch {
           if (typeof info.productImage === 'string') finalImage = info.productImage;
         }
       }

       if (!finalImage || finalImage.includes('placeholder')) { skippedCount++; imageFailedCount++; continue; }
       if (finalImage.startsWith('//')) finalImage = 'https:' + finalImage;
       
       try {
          // Use fetch with a very short timeout to go faster
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 2000);
          const imgRes = await fetch(finalImage, { method: 'HEAD', signal: abortController.signal });
          clearTimeout(timeoutId);
          if (!imgRes.ok) { imageFailedCount++; skippedCount++; continue; }
       } catch(e) {
          imageFailedCount++; skippedCount++; continue;
       }

       try {
           const n = (info.productNameEn || info.productName).toLowerCase();
           let cat = 'Home & Kitchen'; 
           
           if (n.includes('sneaker') || n.includes('shoe') || n.includes('boot') || n.includes('shirt') || n.includes('dress') || n.includes('coat') || n.includes('suit') || n.includes('jacket') || n.includes('pants') || n.includes('clothing') || n.includes('blouse') || n.includes('sweater') || n.includes('hoodie')) {
             cat = 'Apparel & Fashion';
           } else if (n.includes('watch') && !n.includes('smart')) {
             cat = 'Jewelry & Watches';
           } else if (n.includes('headphone') || n.includes('earbud') || n.includes('speaker') || n.includes('electronic') || n.includes('cable') || n.includes('adapter')) {
             cat = 'Electronics';
           } else if (n.includes('ring') || n.includes('necklace') || n.includes('bracelet') || n.includes('jewelry') || n.includes('earring')) {
             cat = 'Jewelry & Watches';
           } else if (n.includes('skincare') || n.includes('serum') || n.includes('makeup') || n.includes('beauty') || n.includes('cosmetic')) {
             cat = 'Beauty & Skincare';
           } else if (n.includes('pet') || n.includes('dog') || n.includes('cat') || n.includes('leash')) {
             cat = 'Pet Supplies';
           } else if (n.includes('smart') && n.includes('watch')) {
             cat = 'Smart Gadgets';
           } else if (n.includes('phone') && (n.includes('case') || n.includes('holder') || n.includes('charger'))) {
             cat = 'Phone Accessories';
           } else if (n.includes('office') || n.includes('desk') || n.includes('keyboard') || n.includes('mouse')) {
             cat = 'Office & Desk';
           } else if (n.includes('baby') || n.includes('kid') || n.includes('toy')) {
             cat = 'Baby & Kids';
           } else if (n.includes('fitness') || n.includes('workout') || n.includes('gym') || n.includes('yoga')) {
             cat = 'Fitness & Health';
           } else if (n.includes('travel') || n.includes('bag') || n.includes('luggage') || n.includes('backpack')) {
             cat = 'Travel Accessories';
           }

           const cjCat = info.categoryName || 'Imported CJ';

           const product = await Product.create({
             name: info.productNameEn || info.productName,
             category: cat,
             cjCategory: cjCat,
             price: salePrice,
             image: finalImage,
             thumbnails: info.productImageSet || [],
             description: info.remark || info.productNameEn,
             stock: listedNum,
             source: 'cj',
             aliexpressProductId: pid,
             aliexpressUrl: `https://cjdropshipping.com/product/${pid}.html`,
             isPublished: true,
             isArchived: false
           });
           
           importedCount++;
           importedCjProducts.push(product);
           categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
           console.log(`Imported ${importedCount}/${required}: ${product.name}`);
       } catch (e) {
           skippedCount++;
       }
    }
    page++;
    if (page > 150) break;
  }

  const countAfter = await Product.countDocuments();

  const fs = await import('fs');
  fs.writeFileSync('expanded-report.txt', `
==== IMPORT REPORT ====
Count Before: ${countBefore}
Count After: ${countAfter}
Imported: ${importedCount}
Skipped: ${skippedCount}
Image Validation Failures: ${imageFailedCount}

Top Categories Added:
${Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1]).map(x => `- ${x[0]}: ${x[1]}`).join('\n')}

==== PRODUCT AUDIT SAMPLE ====
${importedCjProducts.sort(() => 0.5 - Math.random()).slice(0, 10).map((p, idx) => `
${idx + 1}. ${p.name}
   Category: ${p.category}
   CJ Category: ${p.cjCategory}
   Price: $${p.price}
   Image URL: ${p.image}
`).join('')}
  `);

  console.log("Done");
  process.exit(0);
}

run();
