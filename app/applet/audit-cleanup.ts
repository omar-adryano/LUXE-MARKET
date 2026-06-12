import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

// We can define minimal schemas or reuse existing from server/models
async function audit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const db = mongoose.connection.db;

  const products = await db.collection('products').find({}).toArray();
  const shippingCaches = await db.collection('shippingcaches').find({}).toArray();
  
  // Create a map of VIDs that have shipping cache
  const vidHasShipping = new Set(shippingCaches.map(s => s.vid));

  const groupA = []; // Healthy
  const groupB = []; // Missing images
  const groupC = []; // Missing VID
  const groupD = []; // No shipping available
  const otherIssues = [];

  for (const p of products) {
    let reasons = [];
    
    // 1 & 2. Has main image & valid image URL
    let hasMainImage = p.image && typeof p.image === 'string' && p.image.trim() !== '' && p.image.startsWith('http');
    // 3. Has at least 2 gallery images 
    // Sometimes thumbnails array contains the main image, but the requirement is "at least 2 gallery images"
    let thumbnailsCount = Array.isArray(p.thumbnails) ? p.thumbnails.length : 0;
    let hasGallery = thumbnailsCount >= 2;

    if (!hasMainImage || !hasGallery) {
      reasons.push(hasMainImage ? 'Less than 2 gallery images' : 'Missing/invalid main image');
    }

    // 4. Has valid CJ VID
    let hasVid = p.vid && typeof p.vid === 'string' && p.vid.trim() !== '';
    if (!hasVid && p.source === 'cj') {
      reasons.push('Missing CJ VID');
    }

    // 5 & 6. Has shipping cache & method
    let hasShipping = hasVid && vidHasShipping.has(p.vid);
    if (!hasShipping && p.source === 'cj') {
      reasons.push('No shipping available or missing cache');
    }

    // 7. Is product published? -> Assumed yes if in DB, but check 'isPublished' or similar if exists
    let isPublished = p.status !== 'draft' && p.status !== 'hidden';
    
    // 8. Has title
    let hasTitle = p.name && typeof p.name === 'string' && p.name.trim() !== '';
    if (!hasTitle) reasons.push('Missing title');

    // 9. Has price
    let hasPrice = typeof p.price === 'number' && p.price > 0;
    if (!hasPrice) reasons.push('Missing/invalid price');

    // 10. Has category
    let hasCategory = p.category && typeof p.category === 'string' && p.category.trim() !== '';
    if (!hasCategory) reasons.push('Missing category');

    const issueReasons = reasons.join(', ');

    if (!hasMainImage || !hasGallery) {
      groupB.push({ id: p._id.toString(), name: p.name, reason: issueReasons });
    } else if (p.source === 'cj' && !hasVid) {
      groupC.push({ id: p._id.toString(), name: p.name, reason: issueReasons });
    } else if (p.source === 'cj' && !hasShipping) {
      groupD.push({ id: p._id.toString(), name: p.name, reason: issueReasons });
    } else if (reasons.length > 0) {
      otherIssues.push({ id: p._id.toString(), name: p.name, reason: issueReasons });
    } else {
      groupA.push({ id: p._id.toString(), name: p.name });
    }
  }

  console.log('--- PRODUCT CATALOG CLEANUP AUDIT ---');
  console.log(`Total Products: ${products.length}\n`);

  console.log(`Group A (Healthy): ${groupA.length}`);
  console.log(`Group B (Image Issues): ${groupB.length}`);
  console.log(`Group C (Missing VID): ${groupC.length}`);
  console.log(`Group D (No Shipping Info): ${groupD.length}`);
  console.log(`Other Issues: ${otherIssues.length}\n`);

  console.log('--- DETAILS ---');
  console.log('\nGROUP B (Missing Images):');
  for (let i = 0; i < Math.min(10, groupB.length); i++) {
    console.log(`[${groupB[i].id}] ${groupB[i].name} - Reason: ${groupB[i].reason}`);
  }
  if (groupB.length > 10) console.log(`... and ${groupB.length - 10} more`);

  console.log('\nGROUP C (Missing VID):');
  for (let i = 0; i < Math.min(10, groupC.length); i++) {
    console.log(`[${groupC[i].id}] ${groupC[i].name} - Reason: ${groupC[i].reason}`);
  }
  if (groupC.length > 10) console.log(`... and ${groupC.length - 10} more`);

  console.log('\nGROUP D (No Shipping Info):');
  for (let i = 0; i < Math.min(10, groupD.length); i++) {
    console.log(`[${groupD[i].id}] ${groupD[i].name} - Reason: ${groupD[i].reason}`);
  }
  if (groupD.length > 10) console.log(`... and ${groupD.length - 10} more`);

  if (otherIssues.length > 0) {
     console.log('\nOther Issues:');
     for (let i = 0; i < Math.min(10, otherIssues.length); i++) {
       console.log(`[${otherIssues[i].id}] ${otherIssues[i].name} - Reason: ${otherIssues[i].reason}`);
     }
  }

  console.log('\n--- RECOMMENDATION ---');
  console.log(`Products safe to keep: ${groupA.length}`);
  console.log(`Products considered for removal (B + C + D + Others): ${groupB.length + groupC.length + groupD.length + otherIssues.length}`);
  console.log(`Products to potentially repair (e.g. refetch shipping limits): ${groupD.length}`);
  
  process.exit();
}

audit();
