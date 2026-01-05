
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ChevronDown,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { mockOrders } from '../lib/mockData';
import { Order, OrderStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err: any) {
      console.warn("Falling back to mock orders due to:", err.message);
      setOrders(mockOrders);
      if (isSupabaseConfigured()) {
        setError("Unable to connect to live database. Viewing local data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic update
    const previousOrders = [...orders];
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));

    try {
      if (!isSupabaseConfigured()) return;
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (updateError) throw updateError;
    } catch (err) {
      console.error("Failed to update status on server:", err);
      setOrders(previousOrders); // Rollback
      alert("Failed to update status on server. Reverting change.");
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
        return { 
          label: 'paid', 
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 size={12} />
        };
      case OrderStatus.SHIPPED:
        return { 
          label: 'shipped', 
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <Truck size={12} />
        };
      case OrderStatus.PENDING:
        return { 
          label: 'pending', 
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Clock size={12} />
        };
      case OrderStatus.DELIVERED:
        return { 
          label: 'delivered', 
          color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: <PackageCheck size={12} />
        };
      default:
        return { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: null };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Order Management</h2>
          <p className="text-slate-400 mt-1">Track and update customer orders across the platform.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 glass-card px-4 py-2.5 rounded-xl text-slate-300 hover:text-white transition-all">
            <Download size={18} />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <button className="flex items-center space-x-2 glass-card px-4 py-3 rounded-xl text-slate-300 hover:text-white transition-all">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className="text-slate-400">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-500 bg-white/5 tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-8 py-5 font-semibold">Customer</th>
                  <th className="px-8 py-5 font-semibold text-center">Status</th>
                  <th className="px-8 py-5 font-semibold">Date</th>
                  <th className="px-8 py-5 font-semibold text-right">Amount</th>
                  <th className="px-8 py-5 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-200 text-lg">
                        {order.customer_name}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <div className="relative inline-block group/menu">
                            <button 
                              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${statusConfig.color}`}
                            >
                              <span>{statusConfig.label}</span>
                              <ChevronDown size={12} className="opacity-50" />
                            </button>
                            
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-slate-900 border border-white/10 rounded-xl shadow-2xl py-2 z-10 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200">
                              {Object.values(OrderStatus).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateStatus(order.id, status)}
                                  className={`w-full text-left px-4 py-2 text-xs font-semibold capitalize hover:bg-white/5 ${
                                    order.status === status ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-400 font-medium">
                        {new Date(order.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-100 text-xl tracking-tight">
                        ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center">
                          <button className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-slate-500">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
