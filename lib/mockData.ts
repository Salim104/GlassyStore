
import { Product, Category, Order, OrderStatus, Profile } from '../types';

export const mockCategories: Category[] = [
  { id: 'c1', name: 'Electronics', created_at: new Date().toISOString() },
  { id: 'c2', name: 'Apparel', created_at: new Date().toISOString() },
  { id: 'c3', name: 'Home & Kitchen', created_at: new Date().toISOString() },
  { id: 'c4', name: 'Accessories', created_at: new Date().toISOString() },
];

export const mockUsers: Profile[] = [
  { id: '1', name: 'Alex Admin', email: 'admin@glassystore.com', role: 'admin', avatar_url: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'user', avatar_url: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Michael Scott', email: 'michael@dundermifflin.com', role: 'user', avatar_url: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Elena Rodriguez', email: 'elena.r@tech.io', role: 'admin', avatar_url: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', name: 'James Wilson', email: 'james.w@outlook.com', role: 'user', avatar_url: 'https://i.pravatar.cc/150?u=5' },
  { id: '6', name: 'Priya Patel', email: 'priya@startup.co', role: 'user', avatar_url: 'https://i.pravatar.cc/150?u=6' },
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Neural Headphones',
    description: 'High fidelity audio with neural noise cancellation.',
    price: 299.99,
    stock: 45,
    category_id: 'c1',
    brand: 'SonicFlow',
    image_url: 'https://picsum.photos/seed/p1/400',
    created_at: new Date().toISOString()
  },
  {
    id: 'p2',
    name: 'Cyber Watch Series X',
    description: 'The future of wrist-wear with holographic display.',
    price: 449.00,
    stock: 12,
    category_id: 'c1',
    brand: 'NanoTech',
    image_url: 'https://picsum.photos/seed/p2/400',
    created_at: new Date().toISOString()
  },
  {
    id: 'p3',
    name: 'Glass Coffee Table',
    description: 'Minimalist coffee table for modern homes.',
    price: 180.00,
    stock: 5,
    category_id: 'c3',
    brand: 'Moderna',
    image_url: 'https://picsum.photos/seed/p3/400',
    created_at: new Date().toISOString()
  },
  {
    id: 'p4',
    name: 'Smart Lamp',
    description: 'Adjustable color temp lamp with app support.',
    price: 89.99,
    stock: 150,
    category_id: 'c1',
    brand: 'Luminaire',
    image_url: 'https://picsum.photos/seed/p4/400',
    created_at: new Date().toISOString()
  }
];

export const mockOrders: Order[] = [
  { id: 'o1', user_id: 'u1', customer_name: 'John Doe', total: 599.98, status: OrderStatus.PAID, created_at: '2023-11-20T10:00:00Z' },
  { id: 'o2', user_id: 'u2', customer_name: 'Jane Smith', total: 120.50, status: OrderStatus.SHIPPED, created_at: '2023-11-21T14:30:00Z' },
  { id: 'o3', user_id: 'u3', customer_name: 'Bob Wilson', total: 449.00, status: OrderStatus.PENDING, created_at: '2023-11-22T09:15:00Z' },
  { id: 'o4', user_id: 'u4', customer_name: 'Alice Brown', total: 89.99, status: OrderStatus.DELIVERED, created_at: '2023-11-23T16:45:00Z' },
  { id: 'o5', user_id: 'u5', customer_name: 'Charlie Davis', total: 1050.00, status: OrderStatus.PAID, created_at: '2023-11-24T11:20:00Z' },
];

export const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 2780 },
  { name: 'May', revenue: 1890 },
  { name: 'Jun', revenue: 2390 },
  { name: 'Jul', revenue: 3490 },
];
