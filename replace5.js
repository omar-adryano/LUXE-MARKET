import fs from 'fs';
import path from 'path';

const targetPath = path.resolve('./src/components/pages/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

content = content.replaceAll('setCjImporting(true)', 'setCjAutoImporting(true)');
content = content.replaceAll('setCjImporting(false)', 'setCjAutoImporting(false)');
content = content.replaceAll('setAliImportError', 'setCjImportError');
content = content.replaceAll('aliImporting', 'cjAutoImporting');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Fixed importing logic');
