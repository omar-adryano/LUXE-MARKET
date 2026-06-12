import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CJDropshippingService } from './server/services/aliexpressService';

dotenv.config();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const activeProducts = await db.collection('products').find({
    source: 'cj',
    isArchived: false,
    isPublished: true
  }).toArray();

  let totalActive = activeProducts.length;
  let stillExisting = 0;
  let removedFromCJ = 0;
  let apiErrors = 0;
  let noLongerSearchable = 0;

  const exExisting: any[] = [];
  const exRemoved: any[] = [];
  const exApiErrors: any[] = [];
  const exNoLongerSearchable: any[] = [];

  let count = 0;
  const startTime = Date.now();
  const TIME_LIMIT = 280000; // 280 seconds

  // load state if exists
  let state = {
    processedIds: [] as string[],
    stillExisting: 0,
    removedFromCJ: 0,
    apiErrors: 0,
    noLongerSearchable: 0,
    exExisting: [] as any[],
    exRemoved: [] as any[],
    exApiErrors: [] as any[],
    exNoLongerSearchable: [] as any[]
  };
  
  if (fs.existsSync('audit_state.json')) {
     state = JSON.parse(fs.readFileSync('audit_state.json', 'utf8'));
  }

  let processedInThisRun = 0;

  for (const p of activeProducts) {
    if (state.processedIds.includes(p.aliexpressProductId)) continue;

    count++;
    processedInThisRun++;
    
    if (Date.now() - startTime >= TIME_LIMIT) {
      console.log('Time limit reached, stopping early to generate report.');
      break;
    }
    if (processedInThisRun % 20 === 0) console.log(`Processed ${count}/${totalActive}`);
    
    if (!p.vid || !p.aliexpressProductId) {
      state.apiErrors++;
      if (state.exApiErrors.length < 20) state.exApiErrors.push(p);
      state.processedIds.push(p.aliexpressProductId || String(p._id));
      continue;
    }

    try {
      const info = await CJDropshippingService.getProductInfo(p.aliexpressProductId);
      state.stillExisting++;
      if (state.exExisting.length < 20) state.exExisting.push({ ...p, cjStatus: info.status });
      if (info.status !== 3) {
         state.noLongerSearchable++;
         if (state.exNoLongerSearchable.length < 20) state.exNoLongerSearchable.push({ ...p, cjStatus: info.status });
      }
    } catch (e: any) {
      if (e.message && e.message.toLowerCase().includes('not found') || e.message.toLowerCase().includes('failed to fetch product info')) {
        state.removedFromCJ++;
        if (state.exRemoved.length < 20) state.exRemoved.push(p);
      } else {
        state.apiErrors++;
        if (state.exApiErrors.length < 20) state.exApiErrors.push({ ...p, err: e.message });
      }
    }

    state.processedIds.push(p.aliexpressProductId);
    await delay(1005);
    
    // Save state
    fs.writeFileSync('audit_state.json', JSON.stringify(state));
  }
  
  // Write final or partial report
  const report = `==================================================
CJ Product Availability Audit
==================================================

Total Active Products: ${totalActive}
Products Processed: ${state.processedIds.length}

Products Still Existing On CJ: ${state.stillExisting}

Products Removed From CJ: ${state.removedFromCJ}

Products Returning API Errors: ${state.apiErrors}

Products No Longer Searchable (Status != 3): ${state.noLongerSearchable}

==================================================

Examples - Products Still Existing On CJ (up to 20):
${state.exExisting.map(p => `- ${p.name} (VID: ${p.vid}) [Status: ${p.cjStatus}]`).join('\n')}

Examples - Products Removed From CJ (up to 20):
${state.exRemoved.map(p => `- ${p.name} (VID: ${p.vid})`).join('\n')}

Examples - Products Returning API Errors (up to 20):
${state.exApiErrors.map(p => `- ${p.name} (VID: ${p.vid}) [Err: ${p.err || 'Missing VID'}]`).join('\n')}

Examples - Products No Longer Searchable (unusual status) (up to 20):
${state.exNoLongerSearchable.map(p => `- ${p.name} (VID: ${p.vid}) [Status: ${p.cjStatus}]`).join('\n')}

==================================================
`;
  fs.writeFileSync('CJ_Availability_Audit_Report.txt', report);
  
  if (state.processedIds.length >= totalActive) {
    console.log('Audit entirely complete.');
  } else {
    console.log('Audit partially complete, please safely run again.');
  }

  console.log('Audit complete.');
  process.exit();
}

run();
