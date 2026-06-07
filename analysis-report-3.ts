import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product.js';
import { ShippingCache } from './server/models/ShippingCache.js';

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

    const normal = [];
    const errors = [];
    const heavy = [];

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

        let isError = false;
        if (origPrice <= 0.05 || (shipCost > 20 && origPrice < 0.10)) {
            errors.push(info);
            isError = true;
        }

        let isHeavy = false;
        if (shipCost > 50) {
            heavy.push(info);
            isHeavy = true;
        }

        if (!isError && !isHeavy && origPrice >= 0.10 && origPrice <= 5 && shipCost >= 2 && shipCost <= 15) {
            normal.push(info);
        }
    }

    console.log(`=== PRICING DATA ANALYSIS REPORT ===\n`);
    console.log(`1. Normal Dropshipping Products: ${normal.length}`);
    console.log(`2. Likely Data Errors: ${errors.length}`);
    console.log(`3. Likely Heavy Items: ${heavy.length}`);

    console.log(`\n--- Sample Normal Products ---`);
    normal.slice(0, 20).forEach(p => {
        console.log(`- ${p.name} (Orig: $${p.origPrice.toFixed(2)}, Ship: $${p.shipCost.toFixed(2)})`);
    });

    console.log(`\n--- Sample Likely Data Errors ---`);
    errors.slice(0, 20).forEach(p => {
        console.log(`- ${p.name} (Orig: $${p.origPrice.toFixed(2)}, Ship: $${p.shipCost.toFixed(2)})`);
    });

    console.log(`\n--- Sample Likely Heavy Items ---`);
    heavy.slice(0, 20).forEach(p => {
        console.log(`- ${p.name} (Orig: $${p.origPrice.toFixed(2)}, Ship: $${p.shipCost.toFixed(2)})`);
    });

    console.log(`\n--- Recommendations ---`);
    console.log(`- Recalculate Prices is safe for all products: NO`);
    console.log(`- Recalculate Prices should exclude anomalous products: YES`);
    console.log(`- Recalculate Prices should only run on validated products: YES`);
    console.log(`\nDetails for recommendation:`);
    console.log(`We recommend EXCLUDING anomalous products (specifically Data Errors with Original Price <= $0.05) from recalculations, as they will lead to severely unprofitable or improperly priced items. Heavy items ($50+ shipping) should be reviewed to ensure their premium pricing is acceptable or if they should be delisted due to exorbitant shipping costs. The Recalculate Prices function should ideally only run on validated products (Normal category) to ensure stable storefront margins.`);

    process.exit(0);
}
run().catch(console.error);
