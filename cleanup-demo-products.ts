import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const demoProducts = await db.collection('products').find({
      source: 'manual',
      $or: [
          { vid: null },
          { vid: { $exists: false } },
          { vid: '' }
      ]
  }).toArray();

  let backupOut = `==================================================
Demo Product Backup Report
==================================================
`;
  
  const idsToDelete = [];

  for (const p of demoProducts) {
      backupOut += `Mongo ID: ${p._id}\n`;
      backupOut += `Name: ${p.name}\n`;
      backupOut += `Category: ${p.category}\n`;
      backupOut += `createdAt: ${p.createdAt}\n`;
      backupOut += `--------------------------------------------------\n`;
      idsToDelete.push(p._id);
  }

  fs.writeFileSync('Demo_Product_Backup_Report.txt', backupOut);
  
  if (idsToDelete.length > 0) {
      await db.collection('products').deleteMany({ _id: { $in: idsToDelete } });
  }

  const remainingProductsCount = await db.collection('products').countDocuments();
  const remainingCjProductsCount = await db.collection('products').countDocuments({ source: 'cj' });

  let finalOut = `==================================================
Demo Product Cleanup Final Report
==================================================

Products Deleted: ${idsToDelete.length}

Products Remaining: ${remainingProductsCount}

CJ Products Remaining: ${remainingCjProductsCount}

==================================================
`;

  fs.writeFileSync('Demo_Product_Cleanup_Final_Report.txt', finalOut);
  console.log(finalOut);
  process.exit(0);
}

run();
