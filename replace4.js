import fs from 'fs';
import path from 'path';

const targetPath = path.resolve('./src/components/pages/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

content = content.replaceAll('handleCJ DropshippingSync', 'handleCjSync');
content = content.replaceAll('handleCJ DropshippingImport', 'handleCjImport');
content = content.replaceAll('importCJ DropshippingProduct', 'importCjProduct');
content = content.replaceAll('editProdCJ DropshippingRemovedFromSync', 'editProdCjRemovedFromSync');
content = content.replaceAll('setEditProdCJ DropshippingRemovedFromSync', 'setEditProdCjRemovedFromSync');
content = content.replaceAll('CJ DropshippingProducts', 'CjProducts');
content = content.replaceAll('CJ Dropshipping Products', 'CJ Products');
content = content.replaceAll('CJ Dropshipping URLs', 'CJ URLs');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Fixed syntax errors');
