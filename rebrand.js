import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const rep of replacements) {
      if (typeof rep.from === 'string') {
        content = content.replaceAll(rep.from, rep.to);
      } else {
        content = content.replace(rep.from, rep.to);
      }
    }
    fs.writeFileSync(fullPath, content, 'utf8');
  } catch (err) {
    console.error(`Error processing file ${filePath}`);
  }
}

// UserDashboard.tsx
replaceInFile('./src/components/pages/UserDashboard.tsx', [
  { from: /luxe_phone/g, to: 'morvex_phone' },
  { from: /luxe_address/g, to: 'morvex_address' },
]);

// Cart.tsx
replaceInFile('./src/components/pages/Cart.tsx', [
  { from: /LUXE25/g, to: 'MORVEX25' },
]);

// Product.tsx
replaceInFile('./src/components/pages/Product.tsx', [
  { from: /Luxe design group/g, to: 'MORVEX design group' },
]);

// Auth.tsx
replaceInFile('./src/components/pages/Auth.tsx', [
  { from: /join Luxe Market benefits/g, to: 'join MORVEX benefits' },
  { from: /admin@luxemarket\.com/g, to: 'admin@morvex.com' },
  { from: /Luxe account/g, to: 'MORVEX account' },
  { from: /Mr\. Luxe Customer/g, to: 'Mr. MORVEX Customer' },
  { from: /Luxe credentials/gi, to: 'MORVEX credentials' },
]);

// Checkout.tsx
replaceInFile('./src/components/pages/Checkout.tsx', [
  { from: /luxe_token/g, to: 'morvex_token' },
]);

// Navbar.tsx
replaceInFile('./src/components/Navbar.tsx', [
  { from: /luxe-navbar/g, to: 'morvex-navbar' },
  { from: /LUXE<span className="text-\[#ff4747\]">MARKET<\/span>/g, to: 'MOR<span className="text-[#ff4747]">VEX</span>' },
]);

// Footer.tsx
replaceInFile('./src/components/Footer.tsx', [
  { from: /luxe-footer/g, to: 'morvex-footer' },
  { from: /LUXE<span className="text-\[#ff4747\]">MARKET<\/span>/g, to: 'MOR<span className="text-[#ff4747]">VEX</span>' },
  { from: /Welcome to Luxe\./g, to: 'Welcome to MORVEX.' },
  { from: /concierge@luxemarket\.digital/g, to: 'concierge@morvex.com' },
  { from: /© 2026 Luxe Market, Ltd\./g, to: '© 2026 MORVEX, Ltd.' },
]);

// AppContext.tsx
replaceInFile('./src/context/AppContext.tsx', [
  { from: /Aural Luxe Wireless Headphones/g, to: 'Aural MORVEX Wireless Headphones' },
  { from: /luxe_user/g, to: 'morvex_user' },
  { from: /luxe_token/g, to: 'morvex_token' },
  { from: /luxe_wishlist/g, to: 'morvex_wishlist' },
  { from: /LUXE25/g, to: 'MORVEX25' },
]);

// ThemeContext.tsx
replaceInFile('./src/context/ThemeContext.tsx', [
  { from: /luxe_theme/g, to: 'morvex_theme' },
]);

// App.tsx
replaceInFile('./src/App.tsx', [
  { from: /Luxe admin console/g, to: 'MORVEX admin console' },
]);

// User controllers/emails
replaceInFile('./server/controllers/userController.ts', [
  { from: /Luxe Market/g, to: 'MORVEX' },
  { from: /Luxe login password/gi, to: 'MORVEX login password' },
]);

// OrderController
replaceInFile('./server/controllers/orderController.ts', [
  { from: /Aural Luxe Wireless Headphones/g, to: 'Aural MORVEX Wireless Headphones' },
]);

// Models
replaceInFile('./server/models/fallback.ts', [
  { from: /Aural Luxe Wireless Headphones/g, to: 'Aural MORVEX Wireless Headphones' },
]);

// Utils
replaceInFile('./server/utils/sendEmail.ts', [
  { from: /Luxe Market <no-reply@luxemarket\.app>/g, to: 'MORVEX <no-reply@morvex.com>' },
]);

// Config files
replaceInFile('./server/config/seed.ts', [
  { from: /Aural Luxe Wireless Headphones/g, to: 'Aural MORVEX Wireless Headphones' },
  { from: /luxemarket/g, to: 'morvex' },
]);
replaceInFile('./server/config/db.ts', [
  { from: /luxe-market/g, to: 'morvex-db' },
]);

// index.html
replaceInFile('./index.html', [
  { from: /Luxe Market/g, to: 'MORVEX' },
  { from: /Luxe/g, to: 'MORVEX' },
]);

console.log('Rebranding substitutions complete');
