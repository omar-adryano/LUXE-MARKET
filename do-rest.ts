import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { Product } from "./server/models/Product.js";
import { CJDropshippingService } from "./server/services/aliexpressService.js";

dotenv.config();

const MISSING = [
  { name: "Baby & Kids", min: 20, kw: "toy" },
  { name: "Travel Accessories", min: 20, kw: "travel" },
  { name: "Office & Desk", min: 20, kw: "office" },
  { name: "Jewelry & Watches", min: 20, kw: "watch" },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shop");
  console.log("== FILL REST ==");

  for (const cat of MISSING) {
    const count = await Product.countDocuments({ category: cat.name });
    if (count < cat.min) {
      let needed = cat.min - count;
      console.log(`Need ${needed} more for ${cat.name}`);
      try {
        await delay(2000);
        let imported = 0;
        for (let page = 1; page <= 3; page++) {
          if (imported >= needed) break;
          const data = await CJDropshippingService.getProducts(cat.kw, page);
          if (data && data.list) {
            for (const item of data.list) {
              if (imported >= needed) break;
              try {
                const exists = await Product.findOne({ aliexpressProductId: item.pid });
                if (exists) continue; // skip API call!
                
                // Bypass slow getProductInfo!
                let salePrice = Number(item.sellPrice) || 10;
                let salePriceRounded = Math.floor(salePrice) + 0.99;
                let originalPrice = Math.floor(salePriceRounded / 0.8) + 0.99;
                
                const p = await Product.create({
                  name: item.productNameEn || item.productName,
                  category: cat.name,
                  price: salePriceRounded,
                  originalPrice: originalPrice,
                  image: item.productImage,
                  stock: item.listedNum || 100,
                  source: 'cj',
                  aliexpressProductId: item.pid,
                  aliexpressUrl: `https://cjdropshipping.com/product/${item.pid}.html`
                });

                if (p) {
                  imported++;
                  console.log(` Imported ${imported} config for ${cat.name} (PID: ${item.pid})`);
                }
              } catch (e: any) {
                console.log("Error importing item:", item.pid, e.message);
              }
            }
          }
        }
      } catch (e: any) {
         console.log("Error fetching products:", e.message);
      }
    }
  }
  process.exit(0);
}
run();
