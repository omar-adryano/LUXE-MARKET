import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './server/models/Product';

dotenv.config();

async function audit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxemarket');
    
    const products = await Product.find({});
    
    const total = products.length;
    
    let withOriginalPrice = 0;
    let missingOriginalPrice = 0;
    
    let withVid = 0;
    let missingVid = 0;
    
    let withAliExpressProductId = 0;
    let missingAliExpressProductId = 0;
    
    let cannotSync = [];
    let cannotRecalculate = [];
    let cannotUpdateShipping = [];

    for (const p of products) {
      if (p.originalPrice != null && p.originalPrice > 0) withOriginalPrice++;
      else missingOriginalPrice++;
      
      if (p.vid != null && p.vid !== '') withVid++;
      else missingVid++;
      
      if (p.aliexpressProductId != null && p.aliexpressProductId !== '') withAliExpressProductId++;
      else missingAliExpressProductId++;
      
      if (!p.aliexpressProductId) cannotSync.push(p.name);
      if (!p.originalPrice) cannotRecalculate.push(p.name);
      if (!p.vid) cannotUpdateShipping.push(p.name);
    }

    console.log('--- RECAP ---');
    console.log('Total products:', total);
    console.log('Products with originalPrice:', withOriginalPrice);
    console.log('Products missing originalPrice:', missingOriginalPrice);
    console.log('Products with vid:', withVid);
    console.log('Products missing vid:', missingVid);
    console.log('Products with aliexpressProductId:', withAliExpressProductId);
    console.log('Products missing aliexpressProductId:', missingAliExpressProductId);
    
    console.log('\n--- IDENTIFY PRODUCTS THAT CANNOT: ---');
    console.log(`Cannot Sync Product (${cannotSync.length}):`, cannotSync);
    console.log(`Cannot Recalculate Prices (${cannotRecalculate.length}):`, cannotRecalculate);
    console.log(`Cannot Update Shipping Costs (${cannotUpdateShipping.length}):`, cannotUpdateShipping);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

audit();
