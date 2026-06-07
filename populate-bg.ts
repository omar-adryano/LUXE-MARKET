import mongoose from 'mongoose';
import { ShippingCache } from './server/models/ShippingCache';
import { Product } from './server/models/Product';
import { CJShippingService } from './server/services/cjShippingService';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    
    const products = await Product.find({ vid: { $type: 'string', $regex: '^.{5,}$' } });
    
    // We already cached some, let's process the rest
    for (const p of products) {
        const cached = await ShippingCache.findOne({ vid: p.vid });
        if (!cached) {
            try {
                await CJShippingService.updateCacheForVariant(p.vid, 'US');
            } catch (err) {
            }
        }
    }
    process.exit(0);
}
run();
