import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const activeCjProducts = await db.collection('products').find({
    source: 'cj',
    isArchived: false,
    isPublished: true
  }).toArray();

  let totalProducts = activeCjProducts.length;
  let withWeight = 0;
  let missingWeight = 0;
  let invalidWeight = 0;

  const missingExamples = [];

  for (const p of activeCjProducts) {
    if (p.weight === undefined || p.weight === null) {
      missingWeight++;
      if (missingExamples.length < 20) {
        missingExamples.push(p);
      }
    } else if (typeof p.weight !== 'number' || isNaN(p.weight) || p.weight <= 0) {
      invalidWeight++;
      if (missingExamples.length < 20) {
        missingExamples.push(p);
      }
    } else {
      withWeight++;
    }
  }

  let report = `==================================================
Weight Integrity Audit Report
==================================================

Total Products: ${totalProducts}
Products With Weight: ${withWeight}
Products Missing Weight: ${missingWeight}
Products With Invalid Weight: ${invalidWeight}

==================================================
Examples of Missing/Invalid Weight (Up to 20):
==================================================
`;

  for (const p of missingExamples) {
    report += `\n- Name: ${p.name}\n  VID: ${p.vid}\n  Weight: ${p.weight}\n`;
  }

  fs.writeFileSync('Weight_Integrity_Audit_Report.txt', report);
  console.log(report);
  process.exit(0);
}

run();
