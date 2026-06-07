import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';
import { ShippingCache } from './server/models/ShippingCache';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');

    const products = await Product.find({ source: 'cj' });
    const caches = await ShippingCache.find({});
    
    // Create a map for quick shipping cost lookup
    const shippingMap = new Map();
    caches.forEach(c => {
        if (c.vid && c.shippingCost) {
            shippingMap.set(c.vid, c.shippingCost);
        }
    });

    const report1 = [];
    const report2 = [];
    const report3 = [];
    const report4 = [];

    for (const p of products) {
        if (!p.vid) continue;
        
        const origPrice = p.originalPrice || 0;
        const shipCost = shippingMap.get(p.vid) || -1;
        if (shipCost === -1) continue; // Skip if no shipping data

        const info = {
            name: p.name,
            vid: p.vid,
            origPrice,
            shipCost
        };

        if (origPrice < 0.50) report1.push(info);
        if (origPrice > 0 && shipCost > 10 * origPrice) report2.push(info);
        if (origPrice <= 0.05) report3.push(info);
        if (shipCost > 50) report4.push(info);
    }
    
    console.log('=== PRICING DATA INTEGRITY AUDIT ===\n');

    console.log(`1. Products where originalPrice < $0.50: ${report1.length}`);
    console.log(`2. Products where shippingCost > 10x originalPrice: ${report2.length}`);
    console.log(`3. Products where originalPrice <= 0.05: ${report3.length}`);
    console.log(`4. Products where shippingCost > $50: ${report4.length}`);
    console.log('\n--- Details ---\n');

    const allAnomaliesMap = new Map();
    [...report1, ...report2, ...report3, ...report4].forEach(p => {
        allAnomaliesMap.set(p.vid, p);
    });
    
    for (const p of allAnomaliesMap.values()) {
        console.log(`Name: ${p.name}`);
        console.log(`CJ Product ID / VID: ${p.vid}`);
        console.log(`Original Price: $${p.origPrice.toFixed(2)}`);
        console.log(`Shipping Cost: $${p.shipCost.toFixed(2)}`);
        
        // Determine source inference
        let sourceReason = 'CJ API';
        if (p.origPrice <= 0.05) {
            sourceReason = 'Data Error / Legacy Import Data (Zeroed/Corrupted Price)';
        } else if (p.shipCost > 10 * p.origPrice) {
            sourceReason = 'Variant Mapping / CJ API Extraneous Shipping Mismatch';
        }

        console.log(`Source Inference: ${sourceReason}`);
        console.log('---');
    }

    process.exit(0);
}
run().catch(console.error);
