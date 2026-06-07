import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    const missing = await Product.find({ vid: { $in: [null, ''] } });
    console.log(`Missing VIDs: ${missing.length}`);
    for(const m of missing.slice(0, 5)) {
        console.log(m.vid, m.aliexpressProductId);
    }
    const withVids = await Product.find({ vid: { $nin: [null, ''] } });
    console.log(`With VIDs: ${withVids.length}`);
    const noVidStr = await Product.find({ vid: 'NO_VID_FOUND' });
    console.log(`NO_VID_FOUND: ${noVidStr.length}`);
    const apiErr = await Product.find({ vid: 'API_ERROR_BG' });
    console.log(`API_ERROR_BG: ${apiErr.length}`);

    process.exit(0);
}
check();
