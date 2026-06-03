import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { Wishlist } from '../models/Wishlist';

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
  },
  {
    name: 'Brass Arch Floor Lamp',
    category: 'Home & Garden',
    price: 345.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1Xf4OmXiHsDq6L6ppMRxys5--TcL13IMcD4o3bguzHSLelSBQndBLpYOeIk3528712Bia2yOsh6Y4NPlQFATwj-SEd_CyejsZNRNZMz7MW9BDMNz4jXrwGdVuMeRjobvFoPXTxd3LyBGKYlTD0uRtghe5QVd7FNH25IaoBpF6OVr7nUs8tEimiuLI2yvzeWd07KBqU-lFRO1JBx8-ohG1JCbC1_E_ylZN3tYCz1J_X9hQRSNfDUfm6o8bEl1CgkfhFCHwvsvKtF',
    description: 'Bespoke brass floor lamp featuring an elegant arched balance arm.',
    stock: 15
  },
  {
    name: 'Walnut Side Table',
    category: 'Furniture',
    price: 180.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdZegM2kQKTvATLjeaMAiA3JbR9ZUBc08GjGjjKeTyE3V7Q27wx4G9xiFOH3Gls0kELGubx0M4UCdIxA3nOeR1t9TDUxpPuGuuBQZL6iSjT1r29sf53ZV_rxyaQDb2nNWvIbhzfCv8IMmOl4KRK61CAwvIvruYDSWBShjQ0o6Cp9S0lSv2fPyPCm1lGuGPCbJyspE_MrKUzlkj-fqfix-JDGNZ-9lN78mT1FnxHPxjQe9YkRs4canWhqyZ9Ht21L1gT5cb3ktcL7Om',
    description: 'Solid walnut Timber side table, beautifully polished and crafted.',
    stock: 20
  },
  {
    name: 'Geo Wool Throw',
    category: 'Home & Garden',
    price: 95.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKYUP5UAZX8Kt8YFeCBwVybVI05nt6_phr5SyjCRXDthgTbqH4E0b9CSjKVb75xFm2oIEvJndf3fQp4Cv3smvs-lyhiepT6tC9mS9oSyjpOprHNyX2mmcL5UI3l4JE-64Z07CklWa96iBsP08fr9pUij0xlvKn2Yix9xA6hpZEkzLGHQZ65OWZo-aOBhraJ-8b789rToUBUKP0H7Vdh5eqwedudhlrRTykL6NZj_9vYja7n-cwKg6cyTdQNKerWqt0eqLb4UGCXOCJ',
    description: 'Curated geo-pattern wool throw with premium cozy visual feel.',
    stock: 30
  },
  {
    name: 'Abstract Canvas Print',
    category: 'Home & Garden',
    price: 420.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlo7MGRWEIxV8Qe7UNIhfsmB_cQAuOoQEDsRhMIiCZJbb-Tmi36PnvbJ67g-v5XGe_st1M-KWD2L9ViBsTsh8-QhqFCn5b_QSFuu2xOPHmMvqB7_aYeSSG-5xHIJqbYMIMQBx9NSF_HkAOi_Ht3sX3Okg4zoCT8_RP67hNbtbXxXacaVdLUZY602JhW2J-EkzO8aBdNEqG1mqBaSX6Gsqobb0hn9VfW8HtkjHwWch9ZMalt5VL7UUlirtj8oCo_j4eBP_dCyl3LtGq',
    description: 'Artistic abstract painting canvas print with subtle dark line elements.',
    stock: 12
  },
  {
    name: 'Urban Minimalist Sneakers',
    category: 'Sports',
    price: 125.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqhC7ZLAODfIQ5pUED5L5yF-iQnLf2_iCrnp2pZNZ_4r1RTAtQGGhzyQjRtH85ApHoUtSPHgpwRwe6N1UKzaIbLbeorAmAybv8dQ8MyHsHD1zXB9XuJ6AoYo8Q_1qhdL2qGiJYwcCHqRaTN91nsIQmHxoIS0Yunn9ENC6ELolV1sQkb_R968IFEaEKteHJxwmEhPO7cma8bxKTRSNjbf8qIo8w2aB81LGPjN7tjkj_j8aM05SmIq4yOa82fQt9_rrWzLHhsTNFM3oJ',
    description: 'Urban active high-circulation sneakers with elegant leather detailing.',
    stock: 25
  }
];

export async function seedDB(): Promise<void> {
  // Check if database is fully connected (readyState 1)
  const mongoose = await import('mongoose');
  if (mongoose.default.connection.readyState !== 1) {
    console.warn('⚠️ [Database Seed] Skipped database seeding because MongoDB is not connected.');
    return;
  }

  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.create(initialCategories);
      console.log('🌱 [Database Seed] Initialized categories successfully.');
    }

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.create(initialProducts);
      console.log('🌱 [Database Seed] Initialized default boutique products catalog.');
    } else {
      // Ensure missing products are seeded even if the collection is partially created
      for (const p of initialProducts) {
        const exists = await Product.findOne({ name: p.name });
        if (!exists) {
          await Product.create(p);
          console.log(`🌱 [Database Seed] Added missing product: ${p.name}`);
        }
      }
    }

    const usersToSeed = [
      {
        name: 'Omar Admin',
        username: 'omar',
        email: 'admin@luxemarket.com',
        password: 'omar2006$$$',
        role: 'admin' as const,
        isVerified: true,
      },
      {
        name: 'Boutique Guest',
        username: 'guest',
        email: 'user@luxemarket.com',
        password: 'password',
        role: 'user' as const,
        isVerified: true,
      },
      {
        name: 'Atelier Artisan',
        username: 'atelier',
        email: 'name@atelier.com',
        password: 'password',
        role: 'user' as const,
        isVerified: true,
      },
    ];

    for (const u of usersToSeed) {
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        const userObj = await User.create(u);
        await Wishlist.findOneAndUpdate(
          { user: userObj._id },
          { $setOnInsert: { products: [] } },
          { upsert: true }
        );
      } else {
        existingUser.password = u.password;
        existingUser.name = u.name;
        existingUser.role = u.role;
        (existingUser as any).username = u.username;
        existingUser.isVerified = true;
        await existingUser.save();
      }
    }
    console.log('🌱 [Database Seed] Initialized & verified default boutique users: omar (admin@luxemarket.com), guest (user@luxemarket.com), atelier (name@atelier.com).');
  } catch (error) {
    console.error('❌ [Database Seed] Seeding error encountered:', error);
  }
}
