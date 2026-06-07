import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ShippingCache } from './server/models/ShippingCache';
import { Product } from './server/models/Product';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');

    const products = await Product.find({ source: 'cj', vid: { $type: 'string', $regex: '^.{5,}$' } });

    const validCaches = await ShippingCache.find({});
    const validVids = new Set(validCaches.filter(k => k.vid && k.shippingCost).map(c => c.vid));
    
    let eligibleProducts = products.filter(p => validVids.has(p.vid));

    eligibleProducts.sort(() => 0.5 - Math.random());
    const selected = eligibleProducts.slice(0, 10);

    console.log(`\n--- PRICING VERIFICATION REPORT ---\n`);

    for(const p of selected) {
        const cache = await ShippingCache.findOne({ vid: p.vid });
        const cjCost = p.originalPrice || 0;
        const shippingCost = cache ? cache.shippingCost : 4.99;
        const baseCost = cjCost + shippingCost;
        
        const profitMargin = baseCost * 0.30;
        let exactSellPrice = (baseCost + 0.30 + profitMargin) / (1 - 0.029);
        const finalExpectedPrice = Math.floor(exactSellPrice) + 0.99;
        
        const expectedPayPalFee = (finalExpectedPrice * 0.029) + 0.30;
        
        console.log(`Product Name: ${p.name}`);
        console.log(`Original CJ Cost: $${cjCost.toFixed(2)}`);
        console.log(`Cached Shipping Cost: $${shippingCost.toFixed(2)}`);
        console.log(`PayPal Fee (Calculated): $${expectedPayPalFee.toFixed(2)}`);
        console.log(`Profit Rule Applied: 30% margin on base cost`);
        console.log(`Current Store Price: $${(p.price || 0).toFixed(2)}`);
        console.log(`Expected Final Price: $${finalExpectedPrice.toFixed(2)}`);
        console.log(`Price Match: ${Math.abs(p.price - finalExpectedPrice) < 0.02 ? 'Yes' : 'Needs recalculation'}`);
        console.log('---');
    }
    
    process.exit(0);
}
run();
