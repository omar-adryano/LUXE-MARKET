import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

async function getAccessToken() {
  const email = process.env.CJ_API_EMAIL;
  const apiKey = process.env.CJ_API_KEY;

  if (!email || !apiKey) {
    throw new Error('CJ Dropshipping credentials not configured.');
  }

  const response = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: apiKey }),
  });

  const data = await response.json();
  return data.data.accessToken;
}

async function run() {
  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}/product/list?pageNum=1&pageSize=5`, {
    headers: { 'CJ-Access-Token': token }
  });
  const data = await response.json();
  console.log(JSON.stringify(data.data.list[0], null, 2));
  process.exit();
}
run();
