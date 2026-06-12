import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const cjProducts = await db.collection('products').find({ source: 'cj' }).toArray();

  let withVideo = 0;
  let withoutVideo = 0;
  let requireBackfill = 0;

  for (const p of cjProducts) {
    if (!p.videoUrl) {
      withoutVideo++;
    } else {
      if (p.videoUrl.startsWith('data:') || p.videoUrl.startsWith('blob:') || !p.videoUrl.startsWith('http')) {
        requireBackfill++;
      } else {
        withVideo++;
      }
    }
  }

  let finalOut = `==================================================
CJ Product Video Integration Audit
==================================================

Products with video: ${withVideo}

Products without video: ${withoutVideo}

Products requiring backfill: ${requireBackfill}

==================================================
`;

  fs.writeFileSync('CJ_Video_Audit_Report.txt', finalOut);
  console.log(finalOut);
  process.exit(0);
}

run();
