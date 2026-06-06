import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

function cleanTitle(title: string): string {
  // Remove words that are too supplier-like
  let t = title || '';
  t = t.replace(/for women|for men|for lady|for girls|for boys|new-style|new|hot sale|hot|creative|fashion|versatile|casual|retro|vintage-style|european and american/gi, '');
  
  // Remove things like "S925 Sterling Silver" -> "Sterling Silver"
  t = t.replace(/S925/gi, '');
  
  const words = t.split(/[\s,|-]+/).filter(w => w.trim().length > 0);
  
  // Keep first 5-6 words for a clean title
  let clean = words.slice(0, 6).join(' ');
  // Capitalize nicely
  clean = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return clean.trim();
}

function mapCategory(cat: string): string {
  cat = cat.toLowerCase();
  if (cat.includes('phone') || cat.includes('bank') || cat.includes('charger')) return 'Phone Accessories';
  if (cat.includes('smart') || cat.includes('watch') || cat.includes('electronic') || cat.includes('computer') || cat.includes('audio')) return 'Electronics';
  if (cat.includes('kitchen') || cat.includes('home storage') || cat.includes('home decor') || cat.includes('furniture')) return 'Home & Kitchen';
  if (cat.includes('beauty') || cat.includes('skin') || cat.includes('hair') || cat.includes('makeup')) return 'Beauty & Skincare';
  if (cat.includes('fitness') || cat.includes('health') || cat.includes('sport') || cat.includes('yoga')) return 'Fitness & Health';
  if (cat.includes('pet')) return 'Pet Supplies';
  if (cat.includes('office') || cat.includes('desk')) return 'Office & Desk';
  if (cat.includes('travel') || cat.includes('luggage')) return 'Travel Accessories';
  if (cat.includes('jewelry') || cat.includes('ring') || cat.includes('necklace') || cat.includes('earring') || cat.includes('watch')) return 'Jewelry & Watches';
  if (cat.includes('clothing') || cat.includes('shoe') || cat.includes('bag') || cat.includes('wallet')) return 'Apparel & Fashion';
  return 'Smart Gadgets';
}

async function cleanCatalog() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const products = await Product.find({});
  let titlesUpdated = 0;
  let categoriesUpdated = 0;

  for (const p of products) {
    const origTitle = p.name;
    const origCat = p.category;

    const newTitle = cleanTitle(origTitle);
    const newCat = mapCategory(origCat);

    let changed = false;
    if (origTitle !== newTitle && newTitle.length > 0) {
      p.name = newTitle;
      changed = true;
      titlesUpdated++;
    }

    if (origCat !== newCat) {
      p.category = newCat;
      changed = true;
      categoriesUpdated++;
    }

    if (changed) {
      await p.save();
    }
  }

  console.log(`Updated ${titlesUpdated} titles and ${categoriesUpdated} categories.`);

  // Remove overly represented fashion if any, keep a few to not empty catalog.
  // We'll delete some low priority apparel.
  const appCount = await Product.countDocuments({ category: 'Apparel & Fashion' });
  if (appCount > 20) {
     const toRemove = await Product.find({ category: 'Apparel & Fashion' }).limit(appCount - 10);
     for (const r of toRemove) {
       await Product.deleteOne({ _id: r._id });
     }
     console.log(`Removed ${appCount - 10} extra fashion products.`);
  }

  await mongoose.disconnect();
}

cleanCatalog();
