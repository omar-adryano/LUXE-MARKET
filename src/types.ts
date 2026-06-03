/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
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
  source?: 'dsers' | 'manual';
  isArchived?: boolean;
  isPublished?: boolean;
  dsersRemovedFromSync?: boolean;
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
  | 'auth';

export interface Order {
  id: string;
  date: string;
  itemsCount: number;
  itemsSummary: string;
  total: number;
  status: 'Shipped' | 'Processing' | 'Delivered' | 'Pending';
  trackingStep?: number;
}
