import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Order {
  _id: string;
  total: number;
  shippingCost: number;
  discountAmount: number;
  createdAt: string;
  user?: any;
  items: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  status: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  source: string;
  isPublished: boolean;
  isArchived: boolean;
  views?: number;
  numReviews?: number;
}

export interface ShippingCache {
  _id: string;
  vid: string;
  countryCode: string;
  shippingCost: number;
  updatedAt: string;
}

interface AdminData {
  orders: Order[];
  users: User[];
  products: Product[];
  shippingCaches: ShippingCache[];
  stats: any; // original dashboard stats
}

interface AdminDataContextType {
  data: AdminData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('morvex_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, ordersRes, usersRes, productsRes, shippingRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats', { headers }),
        fetch('/api/orders', { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/products'), // Products is public but doesn't have secure info, it's fine
        fetch('/api/shipping/all-caches', { headers })
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      if (!ordersRes.ok) throw new Error('Failed to fetch orders');
      if (!usersRes.ok) throw new Error('Failed to fetch users');

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const usersData = await usersRes.json();
      const productsData = await productsRes.json();
      const shippingData = await shippingRes.json();

      setData({
        stats: statsData.stats,
        orders: ordersData.orders || [],
        users: usersData.users || [],
        products: productsData.products || [],
        shippingCaches: shippingData.caches || []
      });
    } catch (err: any) {
      setError(err.message || 'Error compiling business intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <AdminDataContext.Provider value={{ data, loading, error, refreshData: fetchAllData }}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminData must be used within an AdminDataProvider');
  return context;
};
