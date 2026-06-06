import fs from 'fs';
import path from 'path';

const targetPath = path.resolve('./src/components/pages/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const replacements = [
  { from: 'Gallery Inventory', to: 'Inventory Overview' },
  { from: 'Replenish Gallery Cabin Stock', to: 'Inventory Management' },
  { from: 'Atelier Average Daily Sales', to: 'Average Daily Sales' },
  { from: 'Operations Sync Active', to: 'System Status' },
  { from: 'Active Operations Catalog', to: 'Product Catalog' },
  { from: 'Gallery Collection', to: 'Ordered Items' },
  { from: 'Gallery Category', to: 'Category' },
  { from: 'Gallery Stock Volume', to: 'Stock Volume' },
  { from: 'Gallery category', to: 'Category' },
  { from: 'Archive Gallery Catalog Item', to: 'Archive Product' },
  { from: 'AliExpress Gateway Active', to: 'CJ Gateway Active' },
  { from: 'Sync AliExpress Inventory', to: 'Sync CJ Inventory' },
  { from: 'Sync AliExpress Pricing', to: 'Sync CJ Pricing' },
  { from: 'AliExpress Dropship & Supplier Integration', to: 'CJ Dropshipping Integration' },
  { from: 'AliExpress Product Import', to: 'CJ Product Import' },
  { from: 'AliExpress Product ID', to: 'CJ Product ID' },
  { from: 'Atelier Operations Console', to: 'Admin Operations' },
  { from: 'Retailer Administration Console', to: 'Admin Dashboard' },
  { from: 'Weekly Sales Charting Representation', to: 'Weekly Sales' },
  { from: 'Operations Cabin Locked', to: 'Admin Dashboard Locked' },
  { from: /AliExpress Product/gi, to: 'CJ Product' },
  { from: /AliExpress Products/gi, to: 'CJ Products' },
  { from: /aliexpressRemovedFromSync/g, to: 'cjRemovedFromSync' },
  { from: /AliExpress supplier Synced SKU/g, to: 'CJ Dropshipping Synced SKU' },
  { from: /AliExpress dropshipped catalogue/g, to: 'CJ dropshipped catalogue' },
  { from: /AliExpress active automatic sync list/g, to: 'CJ active automatic sync list' },
  { from: /De-Authorize AliExpress Automation/g, to: 'De-Authorize CJ Automation' },
  { from: /AliExpress orders/g, to: 'CJ orders' },
  { from: /AliExpress catalogs/g, to: 'CJ catalogs' },
  { from: /AliExpress channels/g, to: 'CJ channels' },
  { from: /AliExpress factories/g, to: 'CJ suppliers' },
  { from: /AliExpress URLs/g, to: 'CJ URLs' },
  { from: /AliExpress/g, to: 'CJ Dropshipping' },
  { from: /aliexpressUrl/g, to: 'cjUrl' },
  { from: /aliexpressSyncing/g, to: 'cjSyncing' },
  { from: /aliexpressSyncSuccess/g, to: 'cjSyncSuccess' },
  { from: /setAliExpressUrl/g, to: 'setCjUrl' },
  { from: /setAliexpressSyncing/g, to: 'setCjSyncing' },
  { from: /setAliexpressSyncSuccess/g, to: 'setCjSyncSuccess' },
  { from: /handleAliExpressSync/g, to: 'handleCjSync' },
  { from: /handleAliExpressImport/g, to: 'handleCjImport' },
  { from: /setEditProdAliexpressRemovedFromSync/g, to: 'setEditProdCjRemovedFromSync' },
  { from: /editProdAliexpressRemovedFromSync/g, to: 'editProdCjRemovedFromSync' },
  { from: /aliexpress/g, to: 'cj' },
  { from: /Gallery datasets/gi, to: 'Data Sets' },
  { from: /Atelier/gi, to: 'Store' },
  { from: /Recent Operations Orders/gi, to: 'Recent Orders' },
  { from: /Operations Core/gi, to: 'Store Core' },
];

for (const rep of replacements) {
  content = content.replaceAll(rep.from, rep.to);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Replacements applied successfully');
