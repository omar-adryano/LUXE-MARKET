import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
dotenv.config();

async function checkERR() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    const errCount = await Product.countDocuments({ vid: { $in: ['API_ERROR_BG', 'NO_VID_FOUND'] }});
    console.log(`Error VIDs: ${errCount}`);

    // Let's reset them so the worker can pick them up!
    await Product.updateMany(
       { vid: { $in: ['API_ERROR_BG', 'NO_VID_FOUND'] } },
       { $set: { vid: '' } }
    );
    console.log("Reset error VIDs.");
    process.exit(0);
}
checkERR();
