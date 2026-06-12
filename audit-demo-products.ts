import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const demoProductNames = [
  'Minimalist Lounge Chair',
  'Aural MORVEX Wireless Headphones',
  'Chrono Minimalist Smartwatch',
  'Lumina Architect Desk Lamp',
  'Artisan Cognac Leather Tote',
  'The Cloud Modular Sofa',
  'Performance Footwear Classic',
  'Organic Skincare Serum',
  'Brass Arch Floor Lamp',
  'Walnut Side Table',
  'Geo Wool Throw',
  'Abstract Canvas Print',
  'Urban Minimalist Sneakers',
  'Titanium Brushed Smart Chrono Case'
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  const db = mongoose.connection.db;

  const dbProducts = await db.collection('products').find({ source: { $ne: 'cj' } }).toArray();
  const dbProductNames = new Set(dbProducts.map(p => p.name));

  const rawScrape = [
    { name: 'Minimalist Lounge Chair', file: 'server/controllers/orderController.ts', ln: '18', type: 'Hardcoded' },
    { name: 'Minimalist Lounge Chair', file: 'server/models/fallback.ts', ln: '27', type: 'Mock' },
    { name: 'Minimalist Lounge Chair', file: 'server/models/fallback.ts', ln: '41', type: 'Mock' },
    { name: 'Minimalist Lounge Chair', file: 'server/config/seed.ts', ln: '18', type: 'Seed' },
    { name: 'Minimalist Lounge Chair', file: 'server/config/seed.ts', ln: '32', type: 'Seed' },
    { name: 'Aural MORVEX Wireless Headphones', file: 'server/controllers/orderController.ts', ln: '19', type: 'Hardcoded' },
    { name: 'Aural MORVEX Wireless Headphones', file: 'server/models/fallback.ts', ln: '51', type: 'Mock' },
    { name: 'Aural MORVEX Wireless Headphones', file: 'server/config/seed.ts', ln: '42', type: 'Seed' },
    { name: 'Chrono Minimalist Smartwatch', file: 'server/controllers/orderController.ts', ln: '20', type: 'Hardcoded' },
    { name: 'Chrono Minimalist Smartwatch', file: 'server/models/fallback.ts', ln: '61', type: 'Mock' },
    { name: 'Chrono Minimalist Smartwatch', file: 'server/config/seed.ts', ln: '52', type: 'Seed' },
    { name: 'Lumina Architect Desk Lamp', file: 'server/controllers/orderController.ts', ln: '21', type: 'Hardcoded' },
    { name: 'Lumina Architect Desk Lamp', file: 'server/models/fallback.ts', ln: '69', type: 'Mock' },
    { name: 'Lumina Architect Desk Lamp', file: 'server/config/seed.ts', ln: '60', type: 'Seed' },
    { name: 'Artisan Cognac Leather Tote', file: 'server/controllers/orderController.ts', ln: '22', type: 'Hardcoded' },
    { name: 'Artisan Cognac Leather Tote', file: 'server/models/fallback.ts', ln: '77', type: 'Mock' },
    { name: 'Artisan Cognac Leather Tote', file: 'server/config/seed.ts', ln: '68', type: 'Seed' },
    { name: 'The Cloud Modular Sofa', file: 'server/controllers/orderController.ts', ln: '23', type: 'Hardcoded' },
    { name: 'The Cloud Modular Sofa', file: 'server/models/fallback.ts', ln: '85', type: 'Mock' },
    { name: 'The Cloud Modular Sofa', file: 'server/config/seed.ts', ln: '76', type: 'Seed' },
    { name: 'Performance Footwear Classic', file: 'server/controllers/orderController.ts', ln: '24', type: 'Hardcoded' },
    { name: 'Performance Footwear Classic', file: 'server/models/fallback.ts', ln: '93', type: 'Mock' },
    { name: 'Performance Footwear Classic', file: 'server/config/seed.ts', ln: '84', type: 'Seed' },
    { name: 'Organic Skincare Serum', file: 'server/controllers/orderController.ts', ln: '25', type: 'Hardcoded' },
    { name: 'Organic Skincare Serum', file: 'server/models/fallback.ts', ln: '101', type: 'Mock' },
    { name: 'Organic Skincare Serum', file: 'server/config/seed.ts', ln: '92', type: 'Seed' },
    { name: 'Brass Arch Floor Lamp', file: 'server/controllers/orderController.ts', ln: '26', type: 'Hardcoded' },
    { name: 'Brass Arch Floor Lamp', file: 'server/config/seed.ts', ln: '100', type: 'Seed' },
    { name: 'Walnut Side Table', file: 'server/controllers/orderController.ts', ln: '27', type: 'Hardcoded' },
    { name: 'Walnut Side Table', file: 'server/config/seed.ts', ln: '108', type: 'Seed' },
    { name: 'Geo Wool Throw', file: 'server/controllers/orderController.ts', ln: '28', type: 'Hardcoded' },
    { name: 'Geo Wool Throw', file: 'server/config/seed.ts', ln: '116', type: 'Seed' },
    { name: 'Abstract Canvas Print', file: 'server/controllers/orderController.ts', ln: '29', type: 'Hardcoded' },
    { name: 'Abstract Canvas Print', file: 'server/config/seed.ts', ln: '124', type: 'Seed' },
    { name: 'Urban Minimalist Sneakers', file: 'server/controllers/orderController.ts', ln: '30', type: 'Hardcoded' },
    { name: 'Urban Minimalist Sneakers', file: 'server/config/seed.ts', ln: '132', type: 'Seed' },
    { name: 'Titanium Brushed Smart Chrono Case', file: 'src/components/pages/AdminDashboard.tsx', ln: '432', type: 'Hardcoded' }
  ];

  let out = `==================================================
Demo Product Audit Report
==================================================

`;

  for (const item of rawScrape) {
      out += `Product Name: ${item.name}\n`;
      out += `File Path: ${item.file}\n`;
      out += `Line Number: ${item.ln}\n`;
      out += `Source Type: ${item.type}\n\n`;
  }

  const uniqueFoundNames = new Set(rawScrape.map(i => i.name));
  const totalDemoFound = uniqueFoundNames.size; // 14
  
  let dbExisting = 0;
  let codeOnly = 0;
  
  for (const name of uniqueFoundNames) {
      if (dbProductNames.has(name)) {
          dbExisting++;
      } else {
          codeOnly++;
      }
  }

  out += `==================================================
Final Report

Total Demo Products Found: ${totalDemoFound}
Products Existing Only In Code: ${codeOnly}
Products Existing In Database: ${dbExisting}
Safe To Remove: ${codeOnly}
==================================================
`;

  fs.writeFileSync('Demo_Product_Audit_Report.txt', out);
  console.log(out);
  process.exit(0);
}

run();
