import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ShippingCache } from './server/models/ShippingCache';
import { Product } from './server/models/Product';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    const products = await Product.find({ vid: { $type: 'string', $regex: '^.{5,}$' } });
    const productVids = new Set(products.map(p => p.vid));
    
    const existingCaches = await ShippingCache.find({});
    let cachedAvailable = 0;
    for(const c of existingCaches) {
        if(c.vid && productVids.has(c.vid)) cachedAvailable++;
    }
    
    console.log(`Total VIDs: ${productVids.size}`);
    console.log(`Cached shipping (matching products): ${cachedAvailable}`);
    process.exit(0);
}
run();
