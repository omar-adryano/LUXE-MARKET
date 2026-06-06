import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { Product } from "./server/models/Product.js";
import { Category } from "./server/models/Category.js";
import { CJDropshippingService } from "./server/services/aliexpressService.js";

dotenv.config();

const TARGET_CATEGORIES = [
  { name: "Baby & Kids", min: 20, keywords: ["baby", "toy", "kid", "educational", "learning", "doll", "puzzle", "plush"] },
  { name: "Travel Accessories", min: 20, keywords: ["travel", "luggage", "backpack", "passport", "bag", "pillow", "organizer", "packing"] },
  { name: "Office & Desk", min: 20, keywords: ["desk", "office", "organizer", "mouse", "keyboard", "monitor stand", "pen", "stationery"] },
  { name: "Jewelry & Watches", min: 20, keywords: ["watch", "ring", "bracelet", "necklace", "jewelry", "earring", "pendant"] }
];

const FORBIDDEN_WORDS: Record<string, string[]> = {
  "Electronics": ["clothing", "jewelry", "shoe", "beauty", "pet", "dog", "cat", "dress", "necklace", "ring", "pant", "shirt"],
  "Phone Accessories": ["clothing", "jewelry", "home", "dress", "necklace", "ring", "pant", "shirt", "pet", "kitchen"],
  "Smart Gadgets": ["clothing", "beauty", "pet", "dress", "skincare", "necklace", "ring", "pant", "shirt"],
};

function matchesCategory(title: string, category: string): boolean {
  title = title.toLowerCase();
  
  // check forbidden
  const forbidden = FORBIDDEN_WORDS[category] || [];
  for (const word of forbidden) {
    if (title.includes(word)) return false;
  }
  
  return true;
}

function findBestCategory(title: string): string | null {
  title = title.toLowerCase();
  let best = null;
  let maxScore = 0;
  for (const cat of TARGET_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (title.includes(kw)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      best = cat.name;
    }
  }
  return best;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shop");
  console.log("== CATALOG AUDIT ==");

  // 1. Move "Baby & Kids Toys" to "Baby & Kids"
  await Product.updateMany({ category: "Baby & Kids Toys" }, { category: "Baby & Kids" });

  // 2. Load all products
  const products = await Product.find({});
  let removedCounts = 0;
  let movedCounts = 0;
  let auditedCounts = products.length;

  console.log(`Skipped auditing, proceeding to import missing products.`);

  // Fetch updated counts
  let importedCounts = 0;

  for (const cat of TARGET_CATEGORIES) {
    const count = await Product.countDocuments({ category: cat.name });
    console.log(`[${cat.name}] Current count: ${count} / ${cat.min}`);

    if (count < cat.min) {
      const needed = cat.min - count;
      console.log(`-> Need ${needed} more for ${cat.name}. Searching CJ...`);
      
      // Let's use the first keyword for searching CJ
      const searchTerms = [cat.name, cat.keywords[0], cat.keywords[1]];
      let currentImported = 0;
      
      for (const term of searchTerms) {
        if (currentImported >= needed) break;
        
        for (let page = 1; page <= 3; page++) {
          if (currentImported >= needed) break;
          try {
            await delay(2500);
            const data = await CJDropshippingService.getProducts(term, page);
            if (!data?.list) continue;
            
            for (const item of data.list) {
              if (currentImported >= needed) break;
              
              try {
                await delay(2500);
                const newP = await CJDropshippingService.importProductToDB(item.pid, item.productImage);
                if (newP) {
                  newP.category = cat.name;
                  await newP.save();
                  currentImported++;
                  importedCounts++;
                  console.log(`    Imported ${item.pid} -> ${cat.name}`);
                }
              } catch (e: any) {
                // Ignore duplicate errors silently
              }
            }
          } catch(e: any) {
            console.log("Error querying CJ:", e.message);
          }
        }
      }
    }
  }

  console.log("== IMPORT FINISHED ==");
  
  // Re-check categories and delete empty ones, create missing ones
  const actualCategoriesCount = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  
  const existingCategoryModels = await Category.find({});
  for (const c of existingCategoryModels) {
    const hasProducts = actualCategoriesCount.some(x => x._id === c.name);
    if (!hasProducts) {
      await Category.findByIdAndDelete(c._id);
      console.log("Removed empty category:", c.name);
    }
  }
  
  for (const x of actualCategoriesCount) {
    const exists = existingCategoryModels.find(c => c.name === x._id);
    if (!exists) {
      await Category.create({ name: x._id, description: "Shop " + x._id });
      console.log("Created missing category:", x._id);
    }
    console.log(`Final [${x._id}]: ${x.count} products`);
  }

  console.log(`Total NEW imported: ${importedCounts}`);

  process.exit(0);
}
run();
