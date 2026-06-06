import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { Product } from "./server/models/Product";
import { Category } from "./server/models/Category";
import { CJDropshippingService } from "./server/services/aliexpressService";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/shop");
  console.log("Connected");

  const products = await Product.find({});
  console.log("Total products:", products.length);

  const categories = await Category.find({});
  console.log("Categories:", categories.map((c: any) => c.name));

  // test Cj auth
  try {
     const data = await CJDropshippingService.getProducts("Electronics", 1);
     console.log("CJ Drop shipping success:", data?.list?.length);
  } catch (e) {
     console.log("CJ Drop shipping error:", !!e);
  }

  process.exit(0);
}
run();
