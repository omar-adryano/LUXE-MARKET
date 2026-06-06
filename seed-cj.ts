import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Product } from './server/models/Product';
import { CJDropshippingService } from './server/services/aliexpressService';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Delete existing CJ products
    await Product.deleteMany({ source: 'cj' });
    console.log('Cleared existing CJ products');

    let importedCount = 0;

    for (let page = 1; page <= 5; page++) {
      if (importedCount >= 50) break;
      
      console.log(`Searching CJ for page ${page}...`);
      const data = await CJDropshippingService.getProducts('', page);
      
      if (data && data.list) {
        console.log(`Found ${data.list.length} products. Importing...`);
        for (const item of data.list) {
          if (importedCount >= 50) break;
          try {
            await CJDropshippingService.importProductToDB(item.pid, item.productImage);
            console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 30)}`);
            importedCount++;
          } catch (err: any) {
            if (err.message.includes('already imported') || err.message.includes('duplicate')) {
               console.log(`Already imported ${item.pid}`);
            } else {
               console.error(`Failed to import ${item.pid}: ${err.message}`);
               await new Promise(r => setTimeout(r, 1500));
            }
          }
        }
      }
    }

    console.log(`Seed completed successfully. Imported ${importedCount} new products.`);
    process.exit(0);
  } catch (err: any) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
