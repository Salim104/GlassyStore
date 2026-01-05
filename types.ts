
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar_url?: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  brand: string;
  image_url: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  total: number;
  status: OrderStatus;
  created_at: string;
}

export interface Transaction {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
}
