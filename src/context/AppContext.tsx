/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, ActiveView, Order, User } from '../types';

interface AppContextType {
  products: Product[];
  recommendedProducts: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  orders: Order[];
  activeView: ActiveView;
  selectedProduct: Product;
  searchQuery: string;
  couponApplied: boolean;
  discountAmount: number;
  promoCode: string;
  user: User | null;
  token: string | null;
  wishlist: Product[];
  
  toastMessage: string | null;
  showToast: (msg: string) => void;
  
  // Actions
  setActiveView: (view: ActiveView) => void;
  setSelectedProduct: (product: Product) => void;
  addToCart: (product: Product, quantity?: number, color?: string, material?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setSearchQuery: (query: string) => void;
  applyCoupon: (code: string) => boolean;
  clearCart: () => void;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUserField: (fields: Partial<User>) => void;
  toggleWishlist: (product: Product) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  fetchMyOrders: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Static high-quality list of curated products
  const staticProductsList: Product[] = [
    {
      id: 'lounge-chair',
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
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDTITNjJ1C4Kkhz-LVlyWfQzBoofprIdbzUf4YgrifA1_ocfjlRtVQZE1al0XYiCHWr_96GmZC9_gXhk252rurOKD7-A3px1dbHQ9kIV1Z0MFDaJAhXoUpcVn6L7-dBsFTVNZscYtdXmyV4rPcLtGmVzZ0Waa6HvOqafa5A4C5tdJCwIfIBQhmZ_O8XPnZ4nf2HoZX0_f3trcszHBcHqjjYx0KHu88ixjE4BoXjV8CpkEYzg-sxXS00972KQeiXZulFhmnAm6k8Y7Il',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBJzfS8sbQtDXrX1Rngn6_TdMLHZaxTeb2epuet1RKzTwOj7XgIddzQUa_6xSzA86GXH__zakIfj6FwpMbNRskkdT6H-MgqGG92REN48Jy9-8MVIXbIkLwJD5KhCDMc_koVuoDBqnQHt6hyrAAgum8EYn1i-JaUcaPYo9yzCCwCP5AyCsk52gntK6s_aS-J6TwS9Kda5sS0PPtGpWHBCE6ae_4cQVI05C1zla1RvaxkqbeIBPzUdJXeOYdJWw2v2lVkdurR9KdWYSB5',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCXgWbNh6pykeX6JFRkYBRoGwvsEdZPvUIhnVPk8zOfqH9pjX5LR4DE8FEk3KJefuR7TatAR4ppN7oInbGTFejPJFoAt8jgl4qimVDyfHRf1DOdiWrbK4JuSm8yblb2Zhl1kVg_sHTTVV2RSn_N3tmhDExvSHE7lDcP_DW_VLYsjF5_5_MaL-II4eQP2_OqJu2Ej9fmnOwyKD8KwMCZjPnWM_PSQP7ETPrL5ainf6FrQKcZJXVcc1_pIyCES4Yvrd4HIUuugUNpH95D'
      ],
      description: 'The Minimalist Lounge Chair brings together architectural rigor and unparalleled comfort. Designed for the modern home, its continuous metal frame provides a sturdy, visually light foundation, while the deep, ergonomic seat invites hours of relaxation. Its stain resistant textile covers and robust engineering make it an generational addition to your workspace.',
      features: [
        'High-density memory foam core',
        'Scratch-resistant powder-coated frame',
        'Stain-resistant textile options',
        'No assembly required'
      ]
    },
    {
      id: 'headphones',
      name: 'Aural MORVEX Wireless Headphones',
      category: 'Electronics',
      price: 299.00,
      originalPrice: 375.00,
      discount: 20,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUW-8tzHJfVrEBSEHnH3ft24e4hZ7CSCTgZ2CjaJnCY0E6QIIExDmym5f4QBOw0D-tADMNUdgr3AHFGmQ5y_eGO6kcHGEOJsTSWAN1w44ItCIS_-uh03O3RyT8zrh2xCrKr3DAC1ZNzwMWHMroSHK0Sw4SUw5B_sHJQthKq1u2bBY8XSPbwmKf_LivZ5HCd5wMFw05lMXuuwUurM5ONK702lin9_GrSODgRhxP3Pe7kBV21dZg5XhIIGC8aWaYDG5KvG95HsqlwhYO',
      description: 'Experience pure sonic landscape. Featuring state-of-the-art hybrid noise-canceling technology, immersive audio response, and bespoke ultra-soft memory ear covers for infinite luxurious listening journeys.'
    },
    {
      id: 'smartwatch',
      name: 'Chrono Minimalist Smartwatch',
      category: 'Accessories',
      price: 185.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzZtZZPLKKUANzoVLeiztc9N-s3y4T_qbKuJQr3Ln8QDpYKYFfZjC4vZseEWOlTWKs7RgnoE8lA1hbe6FJgCOJ35hI3jkG_AUm1mvMxFj7pnxB5_j0A80JFZflyys2bM362M2y4xXSOYO1RFHQ-YsPNpn-xVEv14Ujs8m31DXnj2vwAaSm5w229-2Agk4jTY4fpZ5SDae1OGXsWyU5OlC_0P5PWP6yn_9FnasqQlI0kJQUcqn_UZJJMLv7XQl0GbP3PEh-kthDmu2O',
      description: 'Elegant layout with dynamic, modern technology. Real-time organic sync, heart Rate trackers, and deep analytics. Encased in beautiful circular brushed space titanium with premium full grain tan leather band.'
    },
    {
      id: 'desk-lamp',
      name: 'Lumina Architect Desk Lamp',
      category: 'Home & Garden',
      price: 120.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7AX6RJRN0DB7ylS1lcs8747f1tdAAhDk0S9jiBk04iQ_354dzZ5ACY2SZ4k9SuZeQD1H9Phe445C45ZueivYCnwukNut2x-8nDqQ8PTDa7em_iBiqfLxXvzsAcQMDJjdcvAlMtfcPkjd7xuENG5qg4EnWMS7t8n2yiYk1vy8wp9K-S2McJ8qbXSudywSBaEDOpYBXYJjK2DROkaeaJNqoQVhWqe9DPsFkjBdTIkkKoCCBXFywbWrwOUcFK_mAxGaLhPPzhmFZi00m',
      description: 'Engineered architecture of illumination. Beautiful linear balancing arms with fully dimmable LED glow context. Adorned with premium solid brass joints on textured matte powder coating shell.'
    },
    {
      id: 'leather-tote',
      name: 'Artisan Cognac Leather Tote',
      category: 'Fashion',
      price: 450.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD16lZ2bN8_-Qri0g7QryKQlTNw_nA8UHSYoTH_7nHL0R3XNNuyL36AxVUNkCO0r9AHX8nDqioEe7GmOkiy0mkzDwFXnCuid0HoddCIKTutaYdbRUKyvsmgC7hbWS65M39DX68h6OMC6Rk53wx2Urk5fRvu1d7nJavszXSSzcSlgxi0eMrKrtns9knAeijal_L7Fr-_421wcvYcl4FR6JoNM3r2YEUKcOObMcBXPuzdUZB4ku4bkW_Ex0dZ_N2aoQl1lOfZKZELA40A',
      description: 'Meticulously crafted with selected top grain full leather. Spacious, raw leather lining interior compartment configured with structured organizer slots. Fits standard laptops, books, and tablets comfortably.'
    },
    {
      id: 'modular-sofa',
      name: 'The Cloud Modular Sofa',
      category: 'Home & Garden',
      price: 1499.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT5Duqfnw0ipClK4Hc5FGUpwQlpF3E0VPqVMKhz5FFBoX3aFelaRhaJj69J-UuA6yNoecyfo2Vpi0vhsuvP654YtD9YOFHp7cVbWLrquTXeAfTZWnaG23tOePkM6yPGYLWQUNJAG3KsnvtRdGX8G3DxAQ8d6FZWcP7KXsBBaW7e1QmemKAXSqeoH0BzvnzrFyfFVGADTWOOSfJR_SNYby55xpEQAQL1t8jKJYJBiM4Um8A10dXjuSWWUwWg2zMLcOQYDjJ3Hkzj5ET',
      description: 'Your ultimate modular configurations for custom architectural flow. Redefines premium living room lounge aesthetics, featuring responsive structural deep springs and soft velvet touch linen.'
    },
    {
      id: 'red-footwear',
      name: 'Performance Footwear Classic',
      category: 'Sports',
      price: 189.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnnd4oxhgWtV6MAr7zYYhr7e7TmaVRg3goeIUk_GD1p4IkOFHgtojpfGlU1gLeGF6M56z70l-oCPyqaqg9pMX-fDEosIFZkCVB6h5LFWpBxg0A8GQivfU3EUeLWW5iwnUIWII93r83bZOqmaOw0LNoxnLkPeUZP9CLWbAJE46-kUcyqVNQEg97rihPb-grjpIevEOuuMAv9mj9qpD3kUXBPQVuPv9Av0kiwRXuUObtNMEi7ju4Jp9l1Uf0ryfXJYC0sF7BllSz_IuS',
      description: 'Designed for deep traction and dynamic, ergonomic weight redistribution. Engineered mesh covers enable high continuous breathable circulation, paired with architectural shock-damping dynamic heels.'
    },
    {
      id: 'skincare-organic',
      name: 'Organic Skincare Serum',
      category: 'Beauty',
      price: 68.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-ImM5K623zxof58zjXpuvwqa39W6mmcztv79qdiZWcxS204AJgrzE0D7j5pAn1XsDtmoLvAh7I7pQowexmKIEu9h0TaC3xjGngTdFDhIp4wca7FxPASbi-RWThEywDHr8KaGycd8UEbSnSx5V-Z-0bP1M8oLjFEGanOyGS1Nd-kXtGv7RqHeU6TMjO2oWp5D1jqKnbrsZRIWf_LQLAvKdmXWEqCOC1-o7RwMBeAg6hUvB1UIoE1bPTAWJRsJIcCFIie1AdKUiVovp',
      description: 'Eco-conscious botanical daily hydration blend. Infused with highly certified clinical herbal derivatives to softly soothe, restructure elasticity, and lock optimal hydration glow in all complexions.'
    }
  ];

  const productsList = staticProductsList;

  // recommended companion products ("complete the look")
  const recommendedList: Product[] = [
    {
      id: 'floor-lamp',
      name: 'Brass Arch Floor Lamp',
      category: 'Lighting',
      price: 345.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1Xf4OmXiHsDq6L6ppMWMRxys5--TcL13IMcD4o3bguzHSLelSBQndBLpYOeIk3528712Bia2yOsh6Y4NPlQFATwj-SEd_CyejsZNRNZMz7MW9BDMNz4jXrwGdVuMeRjobvFoPXTxd3LyBGKYlTD0uRtghe5QVd7FNH25IaoBpF6OVr7nUs8tEimiuLI2yvzeWd07KBqU-lFRO1JBx8-ohG1JCbC1_E_ylZN3tYCz1J_X9hQRSNfDUfm6o8bEl1CgkfhFCHwvsvKtF'
    },
    {
      id: 'side-table',
      name: 'Walnut Side Table',
      category: 'Tables',
      price: 180.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdZegM2kQKTvATLjeaMAiA3JbR9ZUBc08GjGjjKeTyE3V7Q27wx4G9xiFOH3Gls0kELGubx0M4UCdIxA3nOeR1t9TDUxpPuGuuBQZL6iSjT1r29sf53ZV_rxyaQDb2nNWvIbhzfCv8IMmOl4KRK61CAwvIvruYDSWBShjQ0o6Cp9S0lSv2fPyPCm1lGuGPCbJyspE_MrKUzlkj-fqfix-JDGNZ-9lN78mT1FnxHPxjQe9YkRs4canWhqyZ9Ht21L1gT5cb3ktcL7Om'
    },
    {
      id: 'wool-throw',
      name: 'Geo Wool Throw',
      category: 'Textiles',
      price: 95.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKYUP5UAZX8Kt8YFeCBwVybVI05nt6_phr5SyjCRXDthgTbqH4E0b9CSjKVb75xFm2oIEvJndf3fQp4Cv3smvs-lyhiepT6tC9mS9oSyjpOprHNyX2mmcL5UI3l4JE-64Z07CklWa96iBsP08fr9pUij0xlvKn2Yix9xA6hpZEkzLGHQZ65OWZo-aOBhraJ-8b789rToUBUKP0H7Vdh5eqwedudhlrRTykL6NZj_9vYja7n-cwKg6cyTdQNKerWqt0eqLb4UGCXOCJ'
    },
    {
      id: 'canvas-print',
      name: 'Abstract Canvas Print',
      category: 'Decor',
      price: 420.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlo7MGRWEIxV8Qe7UNIhfsmB_cQAuOoQEDsRhMIiCZJbb-Tmi36PnvbJ67g-v5XGe_st1M-KWD2L9ViBsTsh8-QhqFCn5b_QSFuu2xOPHmMvqB7_aYeSSG-5xHIJqbYMIMQBx9NSF_HkAOi_Ht3sX3Okg4zoCT8_RP67hNbtbXxXacaVdLUZY602JhW2J-EkzO8aBdNEqG1mqBaSX6Gsqobb0hn9VfW8HtkjHwWch9ZMalt5VL7UUlirtj8oCo_j4eBP_dCyl3LtGq'
    }
  ];

  const initialCartItems: CartItem[] = [
    {
      product: productsList[2], // Watch
      quantity: 1,
      selectedColor: 'Matte Black',
      selectedMaterial: 'Leather'
    },
    {
      product: productsList[1], // Headphones
      quantity: 1,
      selectedColor: 'Ivory White',
      selectedMaterial: 'Default'
    },
    {
      product: {
        id: 'sneakers-minimalist',
        name: 'Urban Minimalist Sneakers',
        category: 'Footwear',
        price: 125.00,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqhC7ZLAODfIQ5pUED5L5yF-iQnLf2_iCrnp2pZNZ_4r1RTAtQGGhzyQjRtH85ApHoUtSPHgpwRwe6N1UKzaIbLbeorAmAybv8dQ8MyHsHD1zXB9XuJ6AoYo8Q_1qhdL2qGiJYwcCHqRaTN91nsIQmHxoIS0Yunn9ENC6ELolV1sQkb_R968IFEaEKteHJxwmEhPO7cma8bxKTRSNjbf8qIo8w2aB81LGPjN7tjkj_j8aM05SmIq4yOa82fQt9_rrWzLHhsTNFM3oJ',
      },
      quantity: 1,
      selectedColor: 'White',
      selectedMaterial: 'Size 10'
    }
  ];

  const initialOrders: Order[] = [
    {
      id: 'ORD-9923',
      date: 'Oct 24, 2024',
      itemsCount: 2,
      itemsSummary: 'Aero Glide Pro Sneakers, Nexus Smartwatch V2',
      total: 428.00,
      status: 'Shipped',
      trackingStep: 1
    },
    {
      id: 'ORD-9881',
      date: 'Oct 21, 2024',
      itemsCount: 1,
      itemsSummary: 'The Cloud Modular Sofa',
      total: 1250.00,
      status: 'Processing',
      trackingStep: 0
    },
    {
      id: 'ORD-9755',
      date: 'Oct 15, 2024',
      itemsCount: 4,
      itemsSummary: 'Lumina Architect Desk Lamp, Artisan Cognac Leather Tote, skincare and accessories',
      total: 89.50,
      status: 'Delivered'
    }
  ];

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [products, setProducts] = useState<Product[]>(staticProductsList);

  const refreshCatalog = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.products) {
          const mapped = data.products.map((p: any) => ({
            ...p,
            id: p.id || p._id || String(p._id),
            source: p.source || 'manual',
          }));
          
          // Merge with any of the static products that don't exist in MongoDB yet
          const merged = [...mapped];
          staticProductsList.forEach(staticProd => {
            if (!merged.some(p => p.id === staticProd.id)) {
              merged.push({
                ...staticProd,
                source: staticProd.source || 'manual',
              });
            }
          });
          
          setProducts(merged);
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch products from backend, using fallback:', err);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product>(productsList[0]);
  const [cart, setCart] = useState<CartItem[]>(initialCartItems);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('');

  // Authentication State
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('morvex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('morvex_token') || null;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('morvex_user', JSON.stringify(userData));
    localStorage.setItem('morvex_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('morvex_user');
    localStorage.removeItem('morvex_token');
    setActiveView('home');
  };

  const updateUserField = (fields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      localStorage.setItem('morvex_user', JSON.stringify(updated));
      return updated;
    });
  };

  const addToCart = (product: Product, quantity = 1, color = 'Default', material = 'Default') => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedColor: color, selectedMaterial: material }];
    });
    showToast('✓ Product added to cart');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    ));
  };

  const applyCoupon = (code: string): boolean => {
    const formattedCode = code.toUpperCase().trim();
    if (formattedCode === 'MORVEX25' || formattedCode === 'WELCOME25' || formattedCode === 'SAVE25') {
      setCouponApplied(true);
      setPromoCode(formattedCode);
      // Let's offer a flat 25% discount on checkout or cart subtotal
      return true;
    }
    return false;
  };

  const clearCart = () => {
    setCart([]);
    setCouponApplied(false);
    setDiscountAmount(0);
    setPromoCode('');
  };

  // Fetch orders from MongoDB backend
  const fetchMyOrders = async () => {
    if (!token || !user) {
      setOrders(initialOrders);
      return;
    }
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.orders) {
          const mapped: Order[] = data.orders.map((o: any) => ({
            id: o.id || o._id || String(o),
            date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Curated',
            itemsCount: o.itemsCount || 0,
            itemsSummary: o.itemsSummary || '',
            total: o.total || 0,
            status: o.status || 'Pending',
            trackingStep: o.trackingStep || 0,
          }));
          setOrders(mapped);
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not sync active orders from server database:', err);
    }
  };

  // Sync orders on credentials change
  useEffect(() => {
    fetchMyOrders();
  }, [token, user]);

  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Fetch wishlist helper
  const fetchWishlist = async () => {
    if (!token || !user) {
      const saved = localStorage.getItem('morvex_wishlist');
      if (saved) {
        try {
          setWishlist(JSON.parse(saved));
        } catch {
          setWishlist([]);
        }
      } else {
        setWishlist([]);
      }
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.wishlist) {
          // Map backend product structure to frontend Product structure
          const mapped: Product[] = data.wishlist.map((p: any) => ({
            id: p.id || p._id || String(p._id || p),
            name: p.name || 'Premium Item',
            category: p.category || 'Curated',
            price: p.price || 0,
            image: p.image || '',
            description: p.description || '',
            originalPrice: p.originalPrice,
            discount: p.discount,
            colors: p.colors,
            materials: p.materials,
            thumbnails: p.thumbnails,
            features: p.features
          }));
          setWishlist(mapped);
          localStorage.setItem('morvex_wishlist', JSON.stringify(mapped));
        }
      } else {
        const saved = localStorage.getItem('morvex_wishlist');
        if (saved) setWishlist(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem('morvex_wishlist');
      if (saved) setWishlist(JSON.parse(saved));
    }
  };

  // Sync wishlist on token/user change
  useEffect(() => {
    fetchWishlist();
  }, [token, user]);

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    const localSaved = localStorage.getItem('morvex_wishlist');
    let currentWishlistList: Product[] = localSaved ? JSON.parse(localSaved) : [];
    
    const exists = currentWishlistList.some(item => item.id === product.id);
    let updated: Product[] = [];
    let isAddedNow = false;

    if (exists) {
      updated = currentWishlistList.filter(item => item.id !== product.id);
      isAddedNow = false;
    } else {
      updated = [...currentWishlistList, product];
      isAddedNow = true;
    }

    if (token && user) {
      try {
        const res = await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId: product.id })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.wishlist) {
            // Find products items that match the IDs in the wishlist
            const mapped: Product[] = data.wishlist.map((p: any) => {
              const prodId = p.id || p._id || String(p);
              const found = products.find(item => item.id === prodId);
              return found || {
                id: prodId,
                name: p.name || 'Premium Item',
                category: p.category || 'Curated',
                price: p.price || 0,
                image: p.image || ''
              };
            });
            setWishlist(mapped);
            localStorage.setItem('morvex_wishlist', JSON.stringify(mapped));
            return data.isAdded;
          }
        }
      } catch (err) {
        console.warn('⚠️ Wishlist synced only locally due to offline state.', err);
      }
    }

    setWishlist(updated);
    localStorage.setItem('morvex_wishlist', JSON.stringify(updated));
    return isAddedNow;
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some(item => item.id === productId);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        recommendedProducts: recommendedList,
        cart,
        setCart,
        orders,
        activeView,
        selectedProduct,
        searchQuery,
        couponApplied,
        discountAmount,
        promoCode,
        user,
        token,
        wishlist,
        toastMessage,
        showToast,
        setActiveView,
        setSelectedProduct,
        addToCart,
        removeFromCart,
        updateQuantity,
        setSearchQuery,
        applyCoupon,
        clearCart,
        login,
        logout,
        updateUserField,
        toggleWishlist,
        isInWishlist,
        fetchMyOrders,
        refreshCatalog
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
