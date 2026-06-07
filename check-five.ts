import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
import { ShippingCache } from './server/models/ShippingCache';

dotenv.config();

console.log("Checking 5 random products that have VIDs...");

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');

    const total = await Product.countDocuments();
    const withVid = await Product.countDocuments({ vid: { $regex: '^[a-zA-Z0-9-]+$' }});
    const missingVid = total - withVid;

    console.log(`\n--- RE-AUDIT ---`);
    console.log(`Total products: ${total}`);
    console.log(`Products with vid: ${withVid}`);
    console.log(`Products missing vid: ${missingVid}`);

    const random = await Product.aggregate([
        { $match: { source: 'cj', vid: { $regex: '^[0-9a-zA-Z-]+$' } } },
        { $sample: { size: 5 } }
    ]);
    
    for (const p of random) {
        let sc = await ShippingCache.findOne({ vid: p.vid });
        console.log(`\nName: ${p.name}`);
        console.log(`CJ Product ID: ${p.aliexpressProductId}`);
        console.log(`VID: ${p.vid}`);
        console.log(`Weight: ${p.weight}`);
        console.log(`Shipping Cache Status: ${sc ? 'Cached: '+sc.shippingCost : 'None'}`);
    }
    
    process.exit(0);
}
check();
