import mongoose from 'mongoose';
import { ShippingCache } from './server/models/ShippingCache';
import { Product } from './server/models/Product';
import { CJShippingService } from './server/services/cjShippingService';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    
    // Find all products with a valid vid (length > 5 to ignore placeholders)
    const products = await Product.find({ vid: { $type: 'string', $regex: '^.{5,}$' } });
    console.log(`Found ${products.length} products with valid VID.`);

    let cachedCount = 0;
    let newCachedCount = 0;
    let failedCount = 0;

    // Check which ones are already cached
    const existingCaches = await ShippingCache.find({});
    const cachedVids = new Set(existingCaches.map((c: any) => c.vid));

    const needsCache = products.filter(p => p.vid && !cachedVids.has(p.vid));
    console.log(`Already cached: ${cachedVids.size}. Needs cache: ${needsCache.length}`);

    if (needsCache.length === 0) {
        console.log("All done!");
        process.exit(0);
    }

    // Process those needing cache in a background worker?
    // We can do it here if it's not too many, 1/sec = needsCache.length seconds.
    // If it's a lot, we may time out. Let's just do a max of 200 locally, then if more, we need a background worker.
    
    for (const p of needsCache.slice(0, 50)) {
        try {
            console.log(`Fetching shipping for ${p.vid}...`);
            const cost = await CJShippingService.updateCacheForVariant(p.vid, 'US');
            if (cost !== null) {
                newCachedCount++;
            } else {
                failedCount++;
            }
        } catch (err: any) {
            console.error(`Error on vid ${p.vid}: ${err.message}`);
            failedCount++;
        }
    }
    
    console.log(`Updated ${newCachedCount}, Failed ${failedCount}`);
    process.exit(0);
}
run();
