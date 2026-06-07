import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');

    const total = await Product.countDocuments();
    const withVid = await Product.countDocuments({ vid: { $nin: [null, ''] } });
    const missingVid = await Product.countDocuments({ vid: { $in: [null, ''] } });
    const skipped = await Product.countDocuments({ aliexpressProductId: { $in: [null, ''] } });

    console.log(`\n--- FINAL AUDIT ---`);
    console.log(`Total products: ${total}`);
    console.log(`Products with VID: ${withVid}`);
    console.log(`Products missing VID: ${missingVid}`);
    console.log(`Products skipped: ${skipped}`);
    
    process.exit(0);
}
check();
