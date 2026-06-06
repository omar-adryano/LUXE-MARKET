import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { CJDropshippingService } from './server/services/aliexpressService.js';

const keywords = [
  'wireless earbuds bluetooth',
  'smart watch fitness tracker',
  'ring light selfie',
  'portable charger power bank',
  'phone holder car mount',
  'wifi smart plug',
  'led strip lights',
  'webcam HD',
  'mechanical keyboard',
  'gaming mouse',
  'vegetable chopper slicer',
  'air fryer accessories',
  'kitchen organizer',
  'coffee accessories',
  'silicone cooking tools',
  'food storage containers',
  'facial massager roller',
  'eyelash curler',
  'makeup brush set',
  'hair removal device',
  'LED face mask',
  'resistance bands set',
  'posture corrector',
  'massage gun',
  'yoga mat',
  'ab roller wheel',
  'cable organizer',
  'desk organizer',
  'wall hooks adhesive',
  'shower organizer',
  'pet grooming brush',
  'cat toy interactive',
  'dog collar LED',
  'laptop stand',
  'desk pad',
  'monitor stand',
  'packing cubes',
  'travel neck pillow',
  'passport holder',
  'bluetooth tracker',
  'smart mug',
  'wireless charging pad',
  'phone screen protector'
];

async function seedKeywords() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  // CLEANUP Phase
  console.log('Starting cleanup...');
  const beforeCount = await Product.countDocuments();
  
  // Remove non-cj products
  const delNonCJ = await Product.deleteMany({ source: { $ne: 'cj' } });
  
  // Remove products with bad images
  let invalidCjCount = 0;
  const cjProds = await Product.find({ source: 'cj' });
  for (const p of cjProds) {
    if (!p.image || !p.image.startsWith('http') || p.image === 'undefined' || p.image.includes('placeholder')) {
      await Product.findByIdAndDelete(p._id);
      invalidCjCount++;
    }
  }

  // Remove duplicates
  const allProds = await Product.find({});
  const seenIds = new Set();
  let dupes = 0;
  for (const p of allProds) {
    if (p.aliexpressProductId) {
       if (seenIds.has(p.aliexpressProductId)) {
         await Product.findByIdAndDelete(p._id);
         dupes++;
       } else {
         seenIds.add(p.aliexpressProductId);
       }
    }
  }

  const fakeCount = delNonCJ.deletedCount + invalidCjCount + dupes;
  console.log(`Removed ${fakeCount} fake/invalid/duplicate products.`);
  
  console.log('Starting import...');
  let newlyImported = 0;

  for (const keyword of keywords) {
    try {
      // Check total products count to stop early if we have reached an excess size
      const currentTotal = await Product.countDocuments();
      if (currentTotal > 200) {
          console.log('Reached more than 200 products, stopping import.');
          break;
      }

      console.log(`Searching for: ${keyword}`);
      const data = await CJDropshippingService.getProducts(keyword, 1);
      
      if (!data || !data.list || data.list.length === 0) {
        console.log(`No products found for ${keyword}`);
        continue;
      }

      let countForKeyword = 0;
      for (const item of data.list) {
        if (countForKeyword >= 6) break; // 6 items per keyword

        const existing = await Product.findOne({ aliexpressProductId: item.pid });
        if (existing) {
          continue;
        }

        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          await CJDropshippingService.importProductToDB(item.pid, item.productImage);
          console.log(`Imported ${item.pid} - ${String(item.productNameEn).substring(0, 30)}`);
          newlyImported++;
          countForKeyword++;
        } catch (err: any) {
          console.error(`Failed to import ${item.pid}: ${err.message}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: any) {
       console.error(`Error searching keyword ${keyword}: ${err.message}`);
    }
  }

  console.log(`\nImport complete. Newly imported: ${newlyImported}`);
  const finalCount = await Product.countDocuments();
  const cjCount = await Product.countDocuments({ source: 'cj' });
  
  const stats = {
    totalProductCount: finalCount,
    validCJProducts: cjCount,
    productsAdded: newlyImported,
    fakeProductsRemoved: fakeCount
  };
  
  console.log('FINAL REPORT:');
  console.log(JSON.stringify(stats, null, 2));
  
  // Print some sample products
  const samples = await Product.find({ source: 'cj' }).sort({ _id: -1 }).limit(10);
  console.log('SAMPLE PRODUCTS:');
  samples.forEach(s => {
    const discount = Math.round(((s.originalPrice - s.price) / s.originalPrice) * 100);
    console.log(`- [${s.category}] ${s.name.substring(0, 30)}... | Orig: $${s.originalPrice} | Sale: $${s.price} (${discount}% OFF) | Image: ${s.image}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

seedKeywords();
