import mongoose from 'mongoose';
import { ShippingCache } from './server/models/ShippingCache';
import { Product } from './server/models/Product';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');

    const products = await Product.find({ vid: { $type: 'string', $regex: '^.{5,}$' } });
    const productVids = new Set(products.map(p => p.vid));
    const totalVids = productVids.size;

    while(true) {
        let cachedAvailable = 0;
        const existingCaches = await ShippingCache.find({});
        for(const c of existingCaches) {
            if(c.vid && productVids.has(c.vid)) cachedAvailable++;
        }
        
        console.log(`Cached: ${cachedAvailable} / ${totalVids}`);
        if (cachedAvailable >= totalVids || cachedAvailable >= 485) { // fallback
            break;
        }
        await new Promise(res => setTimeout(res, 10000));
    }
    
    process.exit(0);
}
run();
