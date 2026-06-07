/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  _id?: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  color?: string;
  colors?: string[];
  materials?: string[];
  image: string;
  thumbnails?: string[];
  description?: string;
  features?: string[];
  altDescription?: string;
  source?: 'aliexpress' | 'manual' | 'cj';
  isArchived?: boolean;
  isPublished?: boolean;
  aliexpressRemovedFromSync?: boolean;
  cjRemovedFromSync?: boolean;
  vid?: string;
  isManualPrice?: boolean;
  stock?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedMaterial?: string;
}

export type ActiveView = 
  | 'home'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'checkout-success'
  | 'checkout-cancel'
  | 'user-dashboard'
  | 'admin-dashboard'
  | 'wishlist'
  | 'auth';

export interface Order {
  id: string;
  date: string;
  itemsCount: number;
  itemsSummary: string;
  total: number;
  status: 'Shipped' | 'Processing' | 'Delivered' | 'Pending';
  trackingStep?: number;
  cjOrderId?: string;
  trackingNumber?: string;
}
