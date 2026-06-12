import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class CJ {
  static cachedToken: string | null = null;
  static tokenExpiry: Date | null = null;
  static BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  static async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.tokenExpiry && new Date() < this.tokenExpiry) return this.cachedToken;
    const email = process.env.CJ_API_EMAIL;
    const apiKey = process.env.CJ_API_KEY;
    const response = await fetch(`${this.BASE_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: apiKey }),
    });
    const data = await response.json() as any;
    if (!data.success) throw new Error(data.message || 'Auth failed');
    this.cachedToken = data.data.accessToken;
    this.tokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 12);
    return this.cachedToken!;
  }

  static async getProductInfo(productId: string) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.BASE_URL}/product/query?pid=${productId}`, {
      headers: { 'CJ-Access-Token': token }
    });
    const data = await response.json() as any;
    if (!data.success) throw new Error(data.message || 'Failed to fetch product info');
    return data.data;
  }
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  
  // load existing state
  let state = JSON.parse(fs.readFileSync('audit_state.json', 'utf8'));

  // Need to find all products that failed due to QPS limit
  const failedIds = state.exApiErrors.map((p: any) => p.aliexpressProductId || String(p._id));
  
  // Clear the API errors from state since we will retry them
  // We can't easily clear the counters because we don't know EXACTLY how many QPS vs missing VID.
  // Missing VIDs wouldn't be in exApiErrors unless they had `err`. We can just reset.
  const allIds = state.processedIds;
  state = {
    processedIds: [],
    stillExisting: 0,
    removedFromCJ: 0,
    apiErrors: 0,
    noLongerSearchable: 0,
    exExisting: [], exRemoved: [], exApiErrors: [], exNoLongerSearchable: []
  };

  const db = mongoose.connection.db;
  const activeProducts = await db.collection('products').find({
    source: 'cj',
    isArchived: false,
    isPublished: true
  }).toArray();

  let processedInThisRun = 0;
  const startTime = Date.now();
  const TIME_LIMIT = 45000;

  if (fs.existsSync('audit_state_fix.json')) {
     state = JSON.parse(fs.readFileSync('audit_state_fix.json', 'utf8'));
  }

  for (const p of activeProducts) {
    if (state.processedIds.includes(p.aliexpressProductId)) continue;
    
    processedInThisRun++;
    if (Date.now() - startTime >= TIME_LIMIT) {
      console.log('Time limit reached.');
      break;
    }
    
    if (!p.vid || !p.aliexpressProductId) {
      state.apiErrors++;
      if (state.exApiErrors.length < 20) state.exApiErrors.push(p);
      state.processedIds.push(p.aliexpressProductId || String(p._id));
      continue;
    }

    try {
      const info = await CJ.getProductInfo(p.aliexpressProductId);
      state.stillExisting++;
      if (state.exExisting.length < 20) state.exExisting.push({ ...p, cjStatus: info.status });
      // Fix status check (could be "3" or 3)
      if (String(info.status) !== '3') {
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
    fs.writeFileSync('audit_state_fix.json', JSON.stringify(state));
    await delay(1250); // Increase delay to avoid 1 QPS strict limit
  }
  
  let outRows = [];
  outRows.push('==================================================');
  outRows.push('CJ Product Availability Audit');
  outRows.push('==================================================');
  outRows.push('');
  outRows.push('Total Active Products: ' + activeProducts.length);
  outRows.push('Products Processed: ' + state.processedIds.length);
  outRows.push('');
  outRows.push('Products Still Existing On CJ: ' + state.stillExisting);
  outRows.push('');
  outRows.push('Products Removed From CJ: ' + state.removedFromCJ);
  outRows.push('');
  outRows.push('Products Returning API Errors: ' + state.apiErrors);
  outRows.push('');
  outRows.push('Products No Longer Searchable (Status != 3): ' + state.noLongerSearchable);
  outRows.push('');
  outRows.push('==================================================');
  outRows.push('');
  outRows.push('Examples - Products Still Existing On CJ (up to 20):');
  outRows.push(state.exExisting.map(p => '- ' + p.name + ' (VID: ' + p.vid + ') [Status: ' + p.cjStatus + ']').join('\n'));
  outRows.push('');
  outRows.push('Examples - Products Removed From CJ (up to 20):');
  outRows.push(state.exRemoved.map(p => '- ' + p.name + ' (VID: ' + p.vid + ')').join('\n'));
  outRows.push('');
  outRows.push('Examples - Products Returning API Errors (up to 20):');
  outRows.push(state.exApiErrors.map(p => '- ' + p.name + ' (VID: ' + p.vid + ') [Err: ' + (p.err || 'Missing VID') + ']').join('\n'));
  outRows.push('');
  outRows.push('Examples - Products No Longer Searchable (unusual status) (up to 20):');
  outRows.push(state.exNoLongerSearchable.map(p => '- ' + p.name + ' (VID: ' + p.vid + ') [Status: ' + p.cjStatus + ']').join('\n'));
  outRows.push('');
  outRows.push('==================================================');
  
  const report = outRows.join('\n');
  fs.writeFileSync('CJ_Availability_Audit_Report.txt', report);
  console.log('Processed', state.processedIds.length, '/', activeProducts.length);
  process.exit();
}

run();
