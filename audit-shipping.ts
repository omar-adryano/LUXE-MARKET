import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ShippingCache } from './server/models/ShippingCache';
import { Product } from './server/models/Product';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');

    const products = await Product.find({ vid: { $regex: '^[0-9A-Za-z-]+$' } });
    const productMap = new Map(products.map(p => [p.vid, p]));
    const totalValidVids = products.length;

    let cachedCount = 0;

    const allCaches = await ShippingCache.find({});
    
    let costs: number[] = [];
    let validCaches = [];
    
    for (const c of allCaches) {
        if (c.vid && productMap.has(c.vid)) {
            cachedCount++;
            validCaches.push(c);
            if (c.shippingCost && c.shippingCost > 0) {
                costs.push(c.shippingCost);
            }
        }
    }
    
    const failedCount = totalValidVids - cachedCount;
    
    let avg = 0, min = 0, max = 0;
    if (costs.length > 0) {
        avg = costs.reduce((a,b)=>a+b,0) / costs.length;
        min = Math.min(...costs);
        max = Math.max(...costs);
    }

    console.log(`\n--- SHIPPING CACHE POPULATION AUDIT ---`);
    console.log(`Total products with valid VID: ${totalValidVids}`);
    console.log(`Products successfully cached: ${cachedCount}`);
    console.log(`Products failed/pending shipping lookup: ${failedCount}`);
    console.log(`Average shipping cost: $${avg.toFixed(2)}`);
    console.log(`Cheapest shipping cost: $${min}`);
    console.log(`Highest shipping cost: $${max}`);

    console.log(`\n--- 10 RANDOM PRODUCTS ---`);
    // Pick 10 random from validCaches
    for(let i = 0; i < 10; i++) {
        if(validCaches.length === 0) break;
        const randIdx = Math.floor(Math.random() * validCaches.length);
        const c = validCaches[randIdx];
        validCaches.splice(randIdx, 1);
        const p = productMap.get(c.vid);
        
        console.log(`\nProduct Name: ${p?.name || 'Unknown'}`);
        console.log(`VID: ${c.vid}`);
        console.log(`Shipping Cost: $${c.shippingCost}`);
        console.log(`Shipping Method: ${c.logisticsName}`);
        console.log(`Delivery Days: ${c.estimatedDays || 'N/A'}`);
    }

    process.exit(0);
}
run();
