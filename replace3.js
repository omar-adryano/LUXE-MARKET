import fs from 'fs';
import path from 'path';

const targetPath = path.resolve('./src/components/pages/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

content = content.replaceAll('/api/admin/cj/import', '/api/admin/aliexpress/import');
content = content.replaceAll('/api/admin/cj/${action}', '/api/admin/aliexpress/${action}');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Fixed API routes');
