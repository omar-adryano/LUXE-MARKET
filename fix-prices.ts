import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

async function updatePrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const products = await Product.find({ source: 'cj' });
    let count = 0;
    
    for (const p of products) {
      let basePrice = p.price; // This was original price
      let markupPrice = basePrice * 3;
      if (markupPrice < 4.99) markupPrice = 4.99;
      
      // Round to .99 ending
      markupPrice = Math.floor(markupPrice) + 0.99;
      
      p.price = markupPrice;
      p.originalPrice = markupPrice; // Keep originalPrice the same as new price for now
      await p.save();
      
      console.log(`Updated ${p.name.substring(0, 30)} - New Price: $${p.price.toFixed(2)}`);
      count++;
    }
    
    console.log(`Updated ${count} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePrices();
