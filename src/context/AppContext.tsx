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



  const initialOrders: Order[] = [];

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [products, setProducts] = useState<Product[]>([]);

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
          
          setProducts(mapped);
          setSelectedProduct(prev => prev && Object.keys(prev).length > 0 ? prev : mapped[0] || {} as Product);
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch products from backend, using fallback:', err);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product>({} as Product);
  const [cart, setCart] = useState<CartItem[]>([]);
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
        recommendedProducts: products.slice(0, 4),
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
