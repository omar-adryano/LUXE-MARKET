const fs = require('fs');
const content = fs.readFileSync('src/components/pages/AdminDashboard.tsx', 'utf8');
const replaced = content
  .replace(/dsers/g, 'aliexpress')
  .replace(/DSers/g, 'AliExpress')
  .replace(/Dsers/g, 'Aliexpress')
  .replace(/DsersRemovedFromSync/gi, 'aliexpressRemovedFromSync');
fs.writeFileSync('src/components/pages/AdminDashboard.tsx', replaced);
console.log('Replaced successfully');
