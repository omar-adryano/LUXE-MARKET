import fs from 'fs';

const d1 = JSON.parse(fs.readFileSync('image_results.json'));
const d2 = JSON.parse(fs.readFileSync('ship_results.json'));

const IMAGE_A = d1.A;
const IMAGE_B = d1.B;
const IMAGE_C = d1.C;
const IMAGE_D = d1.D;

const SHIP_A = d2.A;
const SHIP_B = d2.B;
const SHIP_C = d2.C;

console.log(`TOTAL PRODUCTS: 510\n`);

console.log(`IMAGE_A count: ${IMAGE_A}`);
console.log(`IMAGE_B count: ${IMAGE_B}`);
console.log(`IMAGE_C count: ${IMAGE_C.length}`);
console.log(`IMAGE_D count: ${IMAGE_D.length}\n`);

console.log(`SHIP_A count: ${SHIP_A}`);
console.log(`SHIP_B count: ${SHIP_B.length}`);
console.log(`SHIP_C count: ${SHIP_C.length}\n`);

console.log(`==================================================`);
console.log(`SHOW LISTS`);
console.log(`==================================================\n`);

if (IMAGE_C.length === 0) {
  console.log(`No products in IMAGE_C.\n`);
} else {
  IMAGE_C.forEach(item => {
    console.log(`Product Name: ${item.p.name}`);
    console.log(`Product ID: ${item.p._id}`);
    console.log(`Reason: ${item.reason}\n`);
  });
}

IMAGE_D.forEach(item => {
  console.log(`Product Name: ${item.p.name}`);
  console.log(`Product ID: ${item.p._id}`);
  console.log(`Reason: ${item.reason}\n`);
});

SHIP_C.forEach(item => {
  console.log(`Product Name: ${item.p.name}`);
  console.log(`Product ID: ${item.p._id}`);
  console.log(`Reason: No CJ shipping route available for US (API returned no valid freight)\n`);
});

const delSet = new Set([...IMAGE_C.map(i => i.p._id), ...IMAGE_D.map(i => i.p._id), ...SHIP_C.map(i => i.p._id)]);
const repairSet = new Set(SHIP_B);

for (const id of delSet) {
   if (repairSet.has(id)) repairSet.delete(id);
}

const safeToKeepCount = 510 - delSet.size - repairSet.size;

console.log(`==================================================`);
console.log(`FINAL REPORT`);
console.log(`==================================================\n`);

console.log(`Safe To Keep:\n${safeToKeepCount} products`);
console.log(`\nRepairable:\n${repairSet.size} products`);
console.log(`\nSafe To Delete:\n${delSet.size} products`);
