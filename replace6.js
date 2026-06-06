import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const rep of replacements) {
    if (typeof rep.from === 'string') {
      content = content.replaceAll(rep.from, rep.to);
    } else {
      content = content.replace(rep.from, rep.to);
    }
  }
  fs.writeFileSync(fullPath, content, 'utf8');
}

// UserDashboard.tsx
try {
replaceInFile('./src/components/pages/UserDashboard.tsx', [
  { from: /Customer Operations Cabin/g, to: 'My Account' },
  { from: /ATELIER VERIFIED/g, to: 'VERIFIED ACCOUNT' },
  { from: /GOLD MEMBER PRIV PRIVÉ/g, to: 'GOLD MEMBER' },
  { from: /GOLD MEMBER PRIVÉ/g, to: 'GOLD MEMBER' },
  { from: /Atelier Wishlist/g, to: 'Wishlist' },
  { from: /Live Carriage Trackings/g, to: 'Live Order Tracking' },
  { from: /Carriage Order Histories/g, to: 'Order History' },
  { from: /Carriage Statuses/g, to: 'Order Status' },
  { from: /Registered Atelier/g, to: 'Order Registered' },
  { from: /In-Transit Hub/g, to: 'In Transit' },
  { from: /Safely Delivered/g, to: 'Delivered' },
  { from: /validated by luxury logistics/g, to: 'validated by fulfillment network' },
  { from: /cleared customized carriage checking protocols/g, to: 'cleared shipping facility' },
  { from: /signed at carriage destination/g, to: 'signed at delivery destination' },
  { from: /carriage destination/g, to: 'delivery destination' },
  { from: /Carriage Destination/g, to: 'Delivery Destination' },
  { from: /Carriage/g, to: 'Order' },
  { from: /general carriage log directory/g, to: 'general order history' },
  { from: /ATELIER CORE DIRECTORY/g, to: 'ACCOUNT SETTINGS' },
  { from: /Luxe Atelier Loft, High-Street Flat 4D/g, to: '123 Main St, Apt 4D' },
  { from: /ADMIN \(🛡️ OPERATIONS\)/g, to: 'ADMIN' },
  { from: /Shipping & History/g, to: 'Orders' },
]);
} catch(e) {}

// Cart.tsx
try {
replaceInFile('./src/components/pages/Cart.tsx', [
  { from: /Atelier Recommendations/g, to: 'Product Recommendations' },
]);
} catch(e) {}

// Product.tsx
try {
replaceInFile('./src/components/pages/Product.tsx', [
  { from: /Complete the Atelier Look/g, to: 'Frequently Bought Together' },
]);
} catch(e) {}

// Auth.tsx
try {
replaceInFile('./src/components/pages/Auth.tsx', [
  { from: /Enter your Luxe credentials to access your customer operations cabin./g, to: 'Sign in to access your account.' },
  { from: /name@atelier.com/g, to: 'name@example.com' },
]);
} catch(e) {}

// Checkout.tsx
try {
replaceInFile('./src/components/pages/Checkout.tsx', [
  { from: /Secure Order Carriage/g, to: 'Secure Checkout' },
  { from: /Carriage registration/g, to: 'Checkout' },
  { from: /Your order has been registered securely. We have initiated dispatch logistics with our specialty premium carrier. Standard tracking is fully active and maps can be reviewed inside your User Account workspace directory of operations./g, to: 'Your order has been placed successfully. We have initiated dispatch with our delivery partner. You can track your order status in your Account Dashboard.' },
  { from: /Delivery Carriage Destination/g, to: 'Delivery Address' },
  { from: /kenzo@atelier.net/g, to: 'email@example.com' },
  { from: /Atelier Ward \/ City/g, to: 'City / Region' },
  { from: /Carriage Contact Telephone/g, to: 'Contact Telephone' },
  { from: /Atelier Room/g, to: 'Apt\/Suite' },
  { from: /Carriage Review Summary/g, to: 'Order Summary' },
  { from: /Carriage subtotal/g, to: 'Subtotal' },
  { from: /Total Carriage Costs/g, to: 'Total' },
]);
} catch(e) {}

// AdminDashboard.tsx
try {
replaceInFile('./src/components/pages/AdminDashboard.tsx', [
  { from: /Admin Operations/g, to: 'Admin Setup' },
  { from: /Carriage Pricing \(\$\)/g, to: 'Pricing (\$)' },
  { from: /Carriage pricing/g, to: 'Pricing' },
  { from: /operations index/g, to: 'catalog' },
  { from: /Retail Carriage Pricing/g, to: 'Retail Price' },
  { from: /historical operations logs/g, to: 'archive' },
]);
} catch(e) {}

// Footer.tsx
try {
replaceInFile('./src/components/Footer.tsx', [
  { from: /My Cabin \/ Account/g, to: 'My Account' },
  { from: /Global Atelier/g, to: 'Global Stores' },
  { from: /Terms of Carriage/g, to: 'Terms of Service' },
]);
} catch(e) {}

// App.tsx
try {
replaceInFile('./src/App.tsx', [
  { from: /core operations console/g, to: 'admin console' },
]);
} catch(e) {}

console.log('Terminology replacements complete');
