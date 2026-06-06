import dotenv from 'dotenv';
dotenv.config();
import { CJDropshippingService } from './server/services/aliexpressService.js';

async function testOne() {
  console.log('Fetching wireless mouse...');
  let data = await CJDropshippingService.getProducts('wireless mouse', 1);
  console.log(data.list[0].productNameEn);
  
  console.log('Fetching smart home camera...');
  data = await CJDropshippingService.getProducts('smart home camera', 1);
  console.log(data.list[0].productNameEn);

  process.exit(0);
}
testOne();
