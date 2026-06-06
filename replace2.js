import fs from 'fs';
import path from 'path';

const targetPath = path.resolve('./src/components/pages/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

content = content.replaceAll('aliExpressUrl', 'cjUrl');
content = content.replaceAll('setCJ DropshippingUrl', 'setCjUrl');
content = content.replaceAll('setAliImporting', 'setCjImporting');
content = content.replaceAll('setAliImportSuccess', 'setCjImportSuccess');
content = content.replaceAll('aliImporting', 'cjImporting');
content = content.replaceAll('aliImportSuccess', 'cjImportSuccess');
content = content.replaceAll('aliImportError', 'cjImportError');
content = content.replaceAll('importAliExpressProduct', 'importCjProduct');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Fixed IDs');
