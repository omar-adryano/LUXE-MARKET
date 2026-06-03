import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Fallback in-memory database store
export const memoryDb: Record<string, any[]> = {
  Category: [],
  Product: [],
  User: [],
  Order: [],
  Review: [],
  Wishlist: []
};

// Initial Seed Data to populate memory fallback if Atlas is disconnected
const initialCategories = [
  { name: 'Furniture', description: 'Architectural furniture and modular systems' },
  { name: 'Electronics', description: 'Immersive sound decks and audio units' },
  { name: 'Accessories', description: 'High-density chronometers and wearables' },
  { name: 'Home & Garden', description: 'Workspace illumination and styling' },
  { name: 'Fashion', description: 'Top grain full-grain leather artifacts' },
  { name: 'Sports', description: 'High-traction ergonomic shoes' },
  { name: 'Beauty', description: 'Clinical botanical hydration serums' },
];

const initialProducts = [
  {
    name: 'Minimalist Lounge Chair',
    category: 'Furniture',
    price: 899.00,
    originalPrice: 1200.00,
    discount: 25,
    color: 'Arctic White',
    colors: ['#F4F4F5', '#18181B', '#8D7660'],
    materials: ['Premium Boucle', 'Smooth Leather'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC56VxcH_bLw8j15i7JjJu7ELWlDudrSxogZETB1-CvRGPKnU66GYwgkYZkUtydSZgGZM8Sn-1RmXEunpZAIFm-X-F6GYxQaTSjVgWP8H5HWDqQ8mTNyFP4Dho5jnxBw_nlFTlayvNaiV1fQMXJdoXP6HNRLywWSfvfzRp0MjdtOnZ4AyKLw5uqDnokYn5qXxV7AIgHCX9eTZ-P9X9yRwlTBGIbZgi-iP8AktOa_a7XTXwDhGffc-sWYLEzoODOUfWfSww_f6FDAas',
    thumbnails: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAC56VxcH_bLw8j15i7JjJu7ELWlDudrSxogZETB1-CvRGPKnU66GYwgkYZkUtydSZgGZM8Sn-1RmXEunpZAIFm-X-F6GYxQaTSjVgWP8H5HWDqQ8mTNyFP4Dho5jnxBw_nlFTlayvNaiV1fQMXJdoXP6HNRLywWSfvfzRp0MjdtOnZ4AyKLw5uqDnokYn5qXxV7AIgHCX9eTZ-P9X9yRwlTBGIbZgi-iP8AktOa_a7XTXwDhGffc-sWYLEzoODOUfWfSww_f6FDAas',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDTITNjJ1C4Kkhz-LVlyWfQzBoofprIdbzUf4YgrifA1_ocfjlRtVQZE1al0XYiCHWr_96GmZC9_gXhk252rurOKD7-A3px1dbHQ9kIV1Z0MFDaJAhXoUpcVn6L7-A3px1dbHQ9kIV1Z0MFDaJAhXoUpcVn6L7-dBsFTVNZscYtdXmyV4rPcLtGmVzZ0Waa6HvOqafa5A4C5tdJCwIfIBQhmZ_O8XPnZ4nf2HoZX0_f3trcszHBcHqjjYx0KHu88ixjE4BoXjV8CpkEYzg-sxXS00972KQeiXZulFhmnAm6k8Y7Il',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJzfS8sbQtDXrX1Rngn6_TdMLHZaxTeb2epuet1RKzTwOj7XgIddzQUa_6xSzA86GXH__zakIfj6FwpMbNRskkdT6H-MgqGG92REN48Jy9-8MVIXbIkLwJD5KhCDMc_koVuoDBqnQHt6hyrAAgum8EYn1i-JaUcaPYo9yzCCwCP5AyCsk52gntK6s_aS-J6TwS9Kda5sS0PPtGpWHBCE6ae_4cQVI05C1zla1RvaxkqbeIBPzUdJXeOYdJWw2v2lVkdurR9KdWYSB5'
    ],
    description: 'The Minimalist Lounge Chair brings together architectural rigor and unparalleled comfort. Designed for the modern home, its continuous metal frame provides a sturdy, visually light foundation, while the deep, ergonomic seat invites hours of relaxation. Its stain resistant textile covers and robust engineering make it an generational addition to your workspace.',
    features: [
      'High-density memory foam core',
      'Scratch-resistant powder-coated frame',
      'Stain-resistant textile options',
      'No assembly required'
    ],
    stock: 20
  },
  {
    name: 'Aural Luxe Wireless Headphones',
    category: 'Electronics',
    price: 299.00,
    originalPrice: 375.00,
    discount: 20,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUW-8tzHJfVrEBSEHnH3ft24e4hZ7CSCTgZ2CjaJnCY0E6QIIExDmym5f4QBOw0D-tADMNUdgr3AHFGmQ5y_eGO6kcHGEOJsTSWAN1w44ItCIS_-uh03O3RyT8zrh2xCrKr3DAC1ZNzwMWHMroSHK0Sw4SUw5B_sHJQthKq1u2bBY8XSPbwmKf_LivZ5HCd5wMFw05lMXuuwUurM5ONK702lin9_GrSODgRhxP3Pe7kBV21dZg5XhIIGC8aWaYDG5KvG95HsqlwhYO',
    description: 'Experience pure sonic landscape. Featuring state-of-the-art hybrid noise-canceling technology, immersive audio response, and bespoke ultra-soft memory ear covers for infinite luxurious listening journeys.',
    stock: 50
  },
  {
    name: 'Chrono Minimalist Smartwatch',
    category: 'Accessories',
    price: 185.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzZtZZPLKKUANzoVLeiztc9N-s3y4T_qbKuJQr3Ln8QDpYKYFfZjC4vZseEWOlTWKs7RgnoE8lA1hbe6FJgCOJ35hI3jkG_AUm1mvMxFj7pnxB5_j0A80JFZflyys2bM362M2y4xXSOYO1RFHQ-YsPNpn-xVEv14Ujs8m31DXnj2vwAaSm5w229-2Agk4jTY4fpZ5SDae1OGXsWyU5OlC_0P5PWP6yn_9FnasqQlI0kJQUcqn_UZJJMLv7XQl0GbP3PEh-kthDmu2O',
    description: 'Elegant layout with dynamic, modern technology. Real-time organic sync, heart Rate trackers, and deep analytics. Encased in beautiful circular brushed space titanium with premium full grain tan leather band.',
    stock: 35
  },
  {
    name: 'Lumina Architect Desk Lamp',
    category: 'Home & Garden',
    price: 120.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7AX6RJRN0DB7ylS1lcs8747f1tdAAhDk0S9jiBk04iQ_354dzZ5ACY2SZ4k9SuZeQD1H9Phe445C45ZueivYCnwukNut2x-8nDqQ8PTDa7em_iBiqfLxXvzsAcQMDJjdcvAlMtfcPkjd7xuENG5qg4EnWMS7t8n2yiYk1vy8wp9K-S2McJ8qbXSudywSBaEDOpYBXYJjK2DROkaeaJNqoQVhWqe9DPsFkjBdTIkkKoCCBXFywbWrwOUcFK_mAxGaLhPPzhmFZi00m',
    description: 'Engineered architecture of illumination. Beautiful linear balancing arms with fully dimmable LED glow context. Adorned with premium solid brass joints on textured matte powder coating shell.',
    stock: 40
  },
  {
    name: 'Artisan Cognac Leather Tote',
    category: 'Fashion',
    price: 450.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD16lZ2bN8_-Qri0g7QryKQlTNw_nA8UHSYoTH_7nHL0R3XNNuyL36AxVUNkCO0r9AHX8nDqioEe7GmOkiy0mkzDwFXnCuid0HoddCIKTutaYdbRUKyvsmgC7hbWS65M39DX68h6OMC6Rk53wx2Urk5fRvu1d7nJavszXSSzcSlgxi0eMrKrtns9knAeijal_L7Fr-_421wcvYcl4FR6JoNM3r2YEUKcOObMcBXPuzdUZB4ku4bkW_Ex0dZ_N2aoQl1lOfZKZELA40A',
    description: 'Meticulously crafted with selected top grain full leather. Spacious, raw leather lining interior compartment configured with structured organizer slots. Fits standard laptops, books, and tablets comfortably.',
    stock: 15
  },
  {
    name: 'The Cloud Modular Sofa',
    category: 'Home & Garden',
    price: 1499.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT5Duqfnw0ipClK4Hc5FGUpwQlpF3E0VPqVMKhz5FFBoX3aFelaRhaJj69J-UuA6yNoecyfo2Vpi0vhsuvP654YtD9YOFHp7cVbWLrquTXeAfTZWnaG23tOePkM6yPGYLWQUNJAG3KsnvtRdGX8G3DxAQ8d6FZWcP7KXsBBaW7e1QmemKAXSqeoH0BzvnzrFyfFVGADTWOOSfJR_SNYby55xpEQAQL1t8jKJYJBiM4Um8A10dXjuSWWUwWg2zMLcOQYDjJ3Hkzj5ET',
    description: 'Your ultimate modular configurations for custom architectural flow. Redefines premium living room lounge aesthetics, featuring responsive structural deep springs and soft velvet touch linen.',
    stock: 8
  },
  {
    name: 'Performance Footwear Classic',
    category: 'Sports',
    price: 189.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnnd4oxhgWtV6MAr7zYYhr7e7TmaVRg3goeIUk_GD1p4IkOFHgtojpfGlU1gLeGF6M56z70l-oCPyqaqg9pMX-fDEosIFZkCVB6h5LFWpBxg0A8GQivfU3EUeLWW5iwnUIWII93r83bZOqmaOw0LNoxnLkPeUZP9CLWbAJE46-kUcyqVNQEg97rihPb-grjpIevEOuuMAv9mj9qpD3kUXBPQVuPv9Av0kiwRXuUObtNMEi7ju4Jp9l1Uf0ryfXJYC0sF7BllSz_IuS',
    description: 'Designed for deep traction and dynamic, ergonomic weight redistribution. Engineered mesh covers enable high continuous breathable circulation, paired with architectural shock-damping dynamic heels.',
    stock: 25
  },
  {
    name: 'Organic Skincare Serum',
    category: 'Beauty',
    price: 68.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-ImM5K623zxof58zjXpuvwqa39W6mmcztv79qdiZWcxS204AJgrzE0D7j5pAn1XsDtmoLvAh7I7pQowexmKIEu9h0TaC3xjGngTdFDhIp4wca7FxPASbi-RWThEywDHr8KaGycd8UEbSnSx5V-Z-0bP1M8oLjFEGanOyGS1Nd-kXtGv7RqHeU6TMjO2oWp5D1jqKnbrsZRIWf_LQLAvKdmXWEqCOC1-o7RwMBeAg6hUvB1UIoE1bPTAWJRsJIcCFIie1AdKUiVovp',
    description: 'Eco-conscious botanical daily hydration blend. Infused with highly certified clinical herbal derivatives to softly soothe, restructure elasticity, and lock optimal hydration glow in all complexions.',
    stock: 60
  }
];

// Initialize categories & products memory lists immediately
memoryDb.Category = initialCategories.map((c, i) => ({
  _id: new mongoose.Types.ObjectId(`0000000000000000000000a${i}`),
  ...c,
  slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  createdAt: new Date(),
  updatedAt: new Date()
}));

memoryDb.Product = initialProducts.map((p, i) => ({
  _id: new mongoose.Types.ObjectId(`0000000000000000000000b${i}`),
  ...p,
  rating: 4.5 + (i % 5) * 0.1,
  reviewsCount: 3 + i,
  createdAt: new Date(),
  updatedAt: new Date()
}));

// Quick fallback matcher matching standard queries including regex and dates
function matchQuery(item: any, query: any): boolean {
  if (!query || Object.keys(query).length === 0) return true;
  
  for (const key of Object.keys(query)) {
    const val = query[key];
    
    // Support $or
    if (key === '$or' && Array.isArray(val)) {
      const matched = val.some(subQuery => matchQuery(item, subQuery));
      if (!matched) return false;
      continue;
    }
    
    // Support regex matching
    if (val && typeof val === 'object' && val.$regex) {
      const regex = val.$regex instanceof RegExp ? val.$regex : new RegExp(val.$regex, 'i');
      const itemVal = item[key];
      if (typeof itemVal !== 'string' || !regex.test(itemVal)) {
        return false;
      }
      continue;
    }

    // Support comparing objects like { $gt: Date }
    if (val && typeof val === 'object' && val.$gt) {
      const itemVal = item[key];
      if (!itemVal || new Date(itemVal) <= new Date(val.$gt)) {
        return false;
      }
      continue;
    }
    
    // Standard primitive strict match
    const itemVal = item[key];
    const itemValStr = itemVal?.toString().toLowerCase();
    const queryValStr = val?.toString().toLowerCase();
    if (itemValStr !== queryValStr) {
      return false;
    }
  }
  return true;
}

// Custom Chain representing standard Mongoose cursor chains (.sort, .select, etc.)
function createQueryChain(results: any[]) {
  const chain: any = {
    sort(sortObj: any) {
      const sorted = [...results];
      const sortKey = Object.keys(sortObj)[0];
      const sortDirection = sortObj[sortKey]; // 1 or -1
      sorted.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * sortDirection;
        }
        return String(valA).localeCompare(String(valB)) * sortDirection;
      });
      return createQueryChain(sorted);
    },
    select(selectStr: any) {
      return this;
    },
    populate(populateStr: any) {
      return this;
    },
    exec() {
      return Promise.resolve(results);
    },
    then(onfulfilled?: any, onrejected?: any) {
      return Promise.resolve(results).then(onfulfilled, onrejected);
    },
    catch(onrejected?: any) {
      return Promise.resolve(results).catch(onrejected);
    }
  };
  return chain;
}

function createQueryChainForSingleItem(item: any) {
  const chain: any = {
    select(selectStr: any) {
      return this;
    },
    populate(populateStr: any) {
      return this;
    },
    exec() {
      return Promise.resolve(item);
    },
    then(onfulfilled?: any, onrejected?: any) {
      return Promise.resolve(item).then(onfulfilled, onrejected);
    },
    catch(onrejected?: any) {
      return Promise.resolve(item).catch(onrejected);
    }
  };
  return chain;
}

// Helper to dynamically wrap a constructed or hydrated Mongoose document.
// This preserves all standard schema methods (like matchPassword) and overrides
// .save() to write state updates back to our in-memory cache if the real DB is disconnected.
function wrapDocument(doc: any, modelName: string) {
  if (!doc) return doc;
  
  const originalSave = doc.save;
  doc.save = async function(this: any) {
    if (mongoose.connection.readyState === 1) {
      return originalSave.apply(this);
    }
    
    console.log(`💾 [Memory DB Fallback] Saving ${modelName} instance to memory store...`);
    
    // Manual triggers of schema model preconditions (pre-save hook equivalents)
    if (modelName === 'Category') {
      if (this.name && !this.slug) {
        this.slug = this.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
    }
    
    if (modelName === 'User') {
      if (this.isModified && this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
    }
    
    // Extract plain object representation of the document
    const itemJson = this.toJSON ? this.toJSON() : JSON.parse(JSON.stringify(this));
    if (!itemJson._id) {
      itemJson._id = new mongoose.Types.ObjectId().toString();
      this._id = itemJson._id;
    } else {
      itemJson._id = itemJson._id.toString();
    }
    
    // Support saving populated fields back if we modify the doc
    const list = memoryDb[modelName];
    const existingIdx = list.findIndex(item => item._id.toString() === itemJson._id.toString());
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...itemJson };
    } else {
      list.push(itemJson);
    }
    return this;
  };
  
  return doc;
}

// The generic model wrapper function - simplified to return the real model directly to disable fallback mode
export function wrapModelWithFallback(realModel: any, modelName: string) {
  return realModel;
}
