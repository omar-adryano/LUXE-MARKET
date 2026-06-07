const fs = require('fs');
const filepath = 'src/context/AppContext.tsx';
let code = fs.readFileSync(filepath, 'utf8');

// 1. Remove staticProductsList
code = code.replace(/  \/\/ Static high-quality list of curated products\n  const staticProductsList: Product\[\] = \[[\s\S]*?\];\n\n  const productsList = staticProductsList;\n/, '');

// 2. Remove recommendedList
code = code.replace(/  \/\/ recommended companion products \(\"complete the look\"\)\n  const recommendedList: Product\[\] = \[[\s\S]*?\];\n/, '');

// 3. Remove initialCartItems
code = code.replace(/  const initialCartItems: CartItem\[\] = \[[\s\S]*?\];\n/, '');

// 4. Update initialOrders
code = code.replace(/  const initialOrders: Order\[\] = \[[\s\S]*?\];\n/, '  const initialOrders: Order[] = [];\n');

// 5. Update useState for products
code = code.replace(/const \[products, setProducts\] = useState<Product\[\]>\(staticProductsList\);/, 'const [products, setProducts] = useState<Product[]>([]);');

// 6. Update merging logic in refreshCatalog
code = code.replace(/          \/\/ Merge with any of the static products that don't exist in MongoDB yet\n          const merged = \[\.\.\.mapped\];\n          staticProductsList\.forEach\(staticProd => \{\n            if \(\!merged\.some\(p => p\.id === staticProd\.id\)\) \{\n              merged\.push\(\{\n                \.\.\.staticProd,\n                source: staticProd\.source \|\| 'manual',\n              \}\);\n            \}\n          \}\);\n          \n          setProducts\(merged\);/, '          setProducts(mapped);\n          setSelectedProduct(prev => prev && Object.keys(prev).length > 0 ? prev : mapped[0] || {} as Product);');

// 7. Update initial state of selectedProduct and cart
code = code.replace(/const \[selectedProduct, setSelectedProduct\] = useState<Product>\(productsList\[0\]\);/, 'const [selectedProduct, setSelectedProduct] = useState<Product>({} as Product);');
code = code.replace(/const \[cart, setCart\] = useState<CartItem\[\]>\(initialCartItems\);/, 'const [cart, setCart] = useState<CartItem[]>([]);');

// 8. Update recommendedProducts in provider value
code = code.replace(/recommendedProducts: recommendedList,/, 'recommendedProducts: products.slice(0, 4),');

fs.writeFileSync(filepath, code);
console.log("Cleanup script completed. Remaining 'staticProductsList':", code.includes('staticProductsList'));
