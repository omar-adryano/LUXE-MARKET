import * as fs from 'fs';

const key = process.env.RAPIDAPI_KEY;
const host = process.env.RAPIDAPI_HOST;

console.log('Secret Key:', key);
console.log('Secret Host:', host);

let envContent = '';
if (fs.existsSync('.env')) {
  envContent = fs.readFileSync('.env', 'utf-8');
}

if (!envContent.includes('RAPIDAPI_KEY')) {
  envContent += `\nRAPIDAPI_KEY=${key || '26c5521005msh6e4aeaf61234af5p12cdb5jsn0e47f049679b'}`;
}
if (!envContent.includes('RAPIDAPI_HOST')) {
  envContent += `\nRAPIDAPI_HOST=${host || 'aliexpress-true-api.p.rapidapi.com'}`;
}

fs.writeFileSync('.env', envContent);
console.log('Updated .env');
