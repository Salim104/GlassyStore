
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  Sparkles,
  RefreshCw,
  Bell,
  TrendingUp,
  LayoutDashboard,
  AlertCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Database
} from 'lucide-react';
import { MetricsCard } from '../components/MetricsCard';
import { RevenueChart, SalesDistribution } from '../components/DashboardCharts';
import { getStoreInsights } from '../lib/geminiService';
import { OrderStatus, Order, Product } from '../types';
import { supabase, withTimeout } from '../lib/supabase';
import { useUIStore } from '../lib/store';

const Dashboard = () => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useUIStore();
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    users: 0,
    inventory: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Increased timeout to 30s to handle Supabase free-tier project wake-up (cold start)
      const results = await withTimeout(Promise.all([
        supabase.from('orders').select('total, status'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('*').lt('stock', 10).limit(3)
      ]), 30000);

      const [ordersRes, usersRes, prodsRes, recentRes, lowStockRes] = results;

      if (ordersRes.error) throw ordersRes.error;

      const totalRevenue = ordersRes.data?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0;
      const totalOrders = ordersRes.data?.length || 0;

      setStats({
        revenue: totalRevenue,
        orders: totalOrders,
        users: usersRes.count || 0,
        inventory: prodsRes.count || 0
      });

      if (recentRes.data) setRecentOrders(recentRes.data);
      if (lowStockRes.data) setLowStockProducts(lowStockRes.data);
      
      if (totalOrders > 0 || prodsRes.count! > 0) {
        const summary = `Revenue: $${totalRevenue.toFixed(2)}, Total Orders: ${totalOrders}, Users: ${usersRes.count}, Inventory: ${prodsRes.count}. Low stock items: ${lowStockRes.data?.length || 0}`;
        setLoadingInsights(true);
        const aiResponse = await getStoreInsights(summary);
        setInsights(aiResponse || "No enough data for AI deep-dive yet.");
        setLoadingInsights(false);
      }
      
      addToast('success', 'Data Synced', 'Dashboard metrics are up to date.');
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      const isTimeout = err.message === 'Request timed out';
      setError(isTimeout 
        ? "The database is taking too long to respond. It might be waking up from a sleep cycle." 
        : "Unable to load real-time metrics. Please check your database connection.");
      
      addToast('error', isTimeout ? 'Connection Timeout' : 'Sync Failed', isTimeout ? 'Database might be waking up.' : 'Could not fetch live data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID: return 'bg-emerald-500/10 text-emerald-400';
      case OrderStatus.SHIPPED: return 'bg-blue-500/10 text-blue-400';
      case OrderStatus.PENDING: return 'bg-amber-500/10 text-amber-400';
      case OrderStatus.DELIVERED: return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-indigo-400" />
            Overview
          </h2>
          <p className="text-slate-400 mt-1">Live store performance and customer activity.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="glass-card p-2.5 rounded-xl text-slate-400 hover:text-white relative">
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950"></div>
          </button>
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Connecting...' : 'Sync Live Data'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-rose-500/20 rounded-lg shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1 pt-1">
            <p className="font-bold text-white mb-1">Data Connection Alert</p>
            <p className="opacity-90">{error}</p>
            {error.includes('waking up') && (
              <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-white/5 flex items-center gap-3">
                <Database size={16} className="text-indigo-400" />
                <span className="text-[11px] text-slate-400">Pro-Tip: Supabase free projects pause after 7 days of inactivity. Click retry to wake it up.</span>
              </div>
            )}
          </div>
          <button 
            onClick={fetchDashboardData} 
            className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/20"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard title="Total Revenue" value={loading ? '---' : `$${stats.revenue.toLocaleString()}`} trend={stats.revenue > 0 ? 12.5 : 0} icon={DollarSign} color="bg-indigo-500" />
        <MetricsCard title="Sales" value={loading ? '---' : `+${stats.orders}`} trend={stats.orders > 0 ? 8.2 : 0} icon={ShoppingCart} color="bg-purple-500" />
        <MetricsCard title="Active Users" value={loading ? '---' : stats.users.toString()} trend={stats.users > 0 ? 2.4 : 0} icon={Users} color="bg-pink-500" />
        <MetricsCard title="Inventory" value={loading ? '---' : `${stats.inventory} Items`} trend={0} icon={Package} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <RevenueChart />
          
          <div className="glass-panel p-6 rounded-2xl min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                Recent Orders
              </h3>
              <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300">View All</button>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse flex items-center px-4 gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-1/4"></div>
                      <div className="h-2 bg-white/5 rounded w-1/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="pb-4 font-semibold px-4">Customer</th>
                      <th className="pb-4 font-semibold text-center">Status</th>
                      <th className="pb-4 font-semibold">Date</th>
                      <th className="pb-4 font-semibold text-right px-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 font-medium text-slate-200 px-4">{order.customer_name}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="py-4 text-right font-bold text-slate-200 px-4">${Number(order.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <ShoppingCart size={40} className="mb-3 text-slate-600" />
                <p className="text-slate-400 text-sm">No recent orders to show.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Critical Alerts / Low Stock */}
          {lowStockProducts.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border-rose-500/20 bg-rose-500/[0.02]">
              <div className="flex items-center space-x-2 text-rose-400 mb-4">
                <AlertTriangle size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Critical Inventory</h3>
              </div>
              <div className="space-y-4">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                        <img src={p.image_url} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[120px]">{p.name}</div>
                        <div className="text-[10px] text-rose-400 font-bold">{p.stock} units left</div>
                      </div>
                    </div>
                    <button className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-panel p-6 rounded-2xl border-indigo-500/20 bg-indigo-500/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Sparkles size={18} />
                <h3 className="font-semibold">AI Business Insights</h3>
              </div>
            </div>
            {loadingInsights ? (
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-white/5 rounded w-4/6 animate-pulse"></div>
              </div>
            ) : (
              <div className="text-sm text-slate-300 leading-relaxed space-y-4">
                {insights ? (
                  <p className="whitespace-pre-line leading-relaxed">{insights}</p>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500 italic">Generate insights by adding orders and products to your live store.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <SalesDistribution />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
