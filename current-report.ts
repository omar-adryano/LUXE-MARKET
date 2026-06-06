import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { Product } from "./server/models/Product.js";
import { Category } from "./server/models/Category.js";
import { CJDropshippingService } from "./server/services/aliexpressService.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shop");
  console.log("== CURRENT REPORT ==");

  const manualCount = await Product.countDocuments({ source: 'manual' });
  console.log("Manual products:", manualCount);

  const stats = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  console.log("Category counts:", stats);

  console.log("== CJ API test removed ==");

  process.exit(0);
}
run();
