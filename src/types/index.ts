import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  categoryName?: string;
  isFeatured: boolean;
  inStock: boolean;
  createdAt: Timestamp | Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: Timestamp | Date;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address?: string;
  notes?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  createdAt: Timestamp | Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export interface Message {
  id: string;
  name: string;
  contact: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp | Date;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}
