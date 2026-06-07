const mongoose = require('mongoose');

async function audit() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/products');
    const data = await res.json();
    let product = data.products.find(p => /^[0-9a-fA-F]{24}$/.test(p._id || p.id));
    if (!product) {
       console.log("No valid Mongo DB product found.");
       return;
    }
    const id = product._id || product.id;
    console.log("Testing on valid product id:", id);

    let p;

    // Test Enable Automatic Pricing
    await fetch(`http://127.0.0.1:3000/api/products/${id}?isAdmin=true`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer test'}, body: JSON.stringify({ isManualPrice: false }) });
    p = await (await fetch(`http://127.0.0.1:3000/api/products/${id}`)).json();
    console.log("Enable Automatic Pricing:", p.product?.isManualPrice === false ? "WORKING" : "BROKEN");

    // Test Lock Manual Pricing
    await fetch(`http://127.0.0.1:3000/api/products/${id}?isAdmin=true`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer test'}, body: JSON.stringify({ isManualPrice: true }) });
    p = await (await fetch(`http://127.0.0.1:3000/api/products/${id}`)).json();
    console.log("Lock Manual Pricing:", p.product?.isManualPrice === true ? "WORKING" : "BROKEN");
    
    // Add dummy testing for other features to see if DB updates
  } catch(e) {
    console.error(e);
  }
}
audit();
