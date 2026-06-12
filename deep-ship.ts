import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CJShippingService } from './server/services/cjShippingService';
import fs from 'fs';

dotenv.config();

async function auditShipping() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const products = await db.collection('products').find({}).toArray();
  const shippingCaches = await db.collection('shippingcaches').find({}).toArray();
  const vidHasShipping = new Set(shippingCaches.map(s => s.vid));

  const SHIP_A = [];
  const SHIP_B = [];
  const SHIP_C = [];

  // filter only CJ products that need to be checked
  const toCheck = products.filter(p => p.source === 'cj' && p.vid && p.vid.trim() !== '' && !vidHasShipping.has(p.vid));

  for (let i = 0; i < products.length; i++) {
     const p = products[i];
     if (p.source !== 'cj') {
        SHIP_A.push({ p, reason: 'Not CJ product' });
     } else if (!p.vid || p.vid.trim() === '') {
        SHIP_C.push({ p, reason: 'Missing CJ VID entirely' });
     } else if (vidHasShipping.has(p.vid)) {
        SHIP_A.push({ p, reason: 'Healthy shipping cache' });
     }
  }

  // Load existing results if any to resume
  let existingB = [];
  let existingC = [];
  let existingChecked = new Set();
  
  if (fs.existsSync('ship_results.json')) {
     const data = JSON.parse(fs.readFileSync('ship_results.json', 'utf8'));
     existingB = data.B || [];
     existingC = data.C || [];
     existingB.forEach(id => existingChecked.add(id));
     existingC.forEach(item => existingChecked.add(item.p._id));
  }

  let checkedThisRun = 0;
  for (let i = 0; i < toCheck.length; i++) {
     const p = toCheck[i];
     const idStr = p._id.toString();
     
     if (existingChecked.has(idStr)) {
        continue;
     }

     try {
        const routeResult = await CJShippingService.calculateFreight(p.vid, 'US', 1);
        if (routeResult && routeResult.data && routeResult.data.length > 0) {
           existingB.push(idStr);
           console.log('Valid:', p.vid);
        } else {
           existingC.push({ p, reason: 'No CJ shipping route available for US' });
           console.log('No Route:', p.vid);
        }
     } catch (e) {
        existingC.push({ p, reason: `CJ shipping API error: ${e.message}` });
        console.log('API Error:', p.vid);
     }
     
     checkedThisRun++;
     fs.writeFileSync('ship_results.json', JSON.stringify({
       A: SHIP_A.length,
       B: existingB,
       C: existingC,
       C_count: existingC.length
     }, null, 2));

     if (checkedThisRun >= 40) {
        console.log('Checked 40. Exiting to avoid timeout');
        process.exit(0);
     }

     await new Promise(r => setTimeout(r, 600)); 
  }

}

auditShipping();
