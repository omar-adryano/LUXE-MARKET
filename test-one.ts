import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

async function testOne() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Fetching smart home camera...');
  const data = await CJDropshippingService.getProducts('smart home camera', 1);
  const pid = data.list[0].pid;
  const existing = await Product.findOne({ aliexpressProductId: pid });
  if (existing) {
    console.log('Already exists');
  } else {
    console.log('Importing...');
    try {
        await CJDropshippingService.importProductToDB(pid, data.list[0].productImage);
        console.log('Imported successfully!');
    } catch(e) {
        console.log('ERROR:', e.message);
    }
  }
  const count = await Product.countDocuments();
  console.log('Total:', count);
  process.exit(0);
}
testOne();
