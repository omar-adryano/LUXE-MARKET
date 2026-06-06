import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';
import { Order } from './server/models/Order.js';
import { User } from './server/models/User.js';

async function cleanData() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const namesToMatch = ['test', 'demo', 'placeholder', 'mock', 'sample'];
  
  // Clean products
  const products = await Product.find({});
  let removedProducts = 0;
  for (const p of products) {
    const title = p.name.toLowerCase();
    if (namesToMatch.some(n => title.includes(n))) {
      await Product.deleteOne({ _id: p._id });
      removedProducts++;
    }
  }
  console.log(`Removed ${removedProducts} test products.`);

  // Clean users
  const users = await User.find({});
  let removedUsers = 0;
  for (const u of users) {
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    if (namesToMatch.some(n => name.includes(n) || email.includes(n))) {
      await User.deleteOne({ _id: u._id });
      removedUsers++;
    }
  }
  console.log(`Removed ${removedUsers} test users.`);

  // Clean orders
  // Let's also remove orders associated with test users or test products, or ones with 'test' in their billing address etc.
  const orders = await Order.find({}).populate('user');
  let removedOrders = 0;
  for (const o of orders) {
    let isTest = false;
    
    if (o.user) {
        const u = o.user as any;
        const name = (u.name || '').toLowerCase();
        if (namesToMatch.some(n => name.includes(n))) isTest = true;
    }

    if (!isTest && o.shippingAddress) {
        const d = JSON.stringify(o.shippingAddress).toLowerCase();
        if (namesToMatch.some(n => d.includes(n))) isTest = true;
    }

    if (isTest) {
      await Order.deleteOne({ _id: o._id });
      removedOrders++;
    }
  }
  console.log(`Removed ${removedOrders} test orders.`);

  await mongoose.disconnect();
}
cleanData();
