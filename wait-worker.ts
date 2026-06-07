import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    while(true) {
        const missing = await Product.find({ vid: { $in: [null, ''] }, source: 'cj' });
        console.log(`Missing VIDs: ${missing.length}`);
        if(missing.length === 0) break;
        await new Promise(res => setTimeout(res, 3000));
    }
    const total = await Product.countDocuments();
    const withVids = await Product.countDocuments({ vid: { $nin: [null, ''] } });
    const missingVids = await Product.countDocuments({ vid: { $in: [null, ''] } });
    
    console.log("Worker completed.");
    console.log(`Total products: ${total}`);
    console.log(`Products with VID: ${withVids}`);
    console.log(`Products missing VID: ${missingVids}`);
    // Products missing VID here might be non-CJ products or missing aliexpress id
    
    process.exit(0);
}
check();
