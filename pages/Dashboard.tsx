
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
  LayoutDashboard
} from 'lucide-react';
import { MetricsCard } from '../components/MetricsCard';
import { RevenueChart, SalesDistribution } from '../components/DashboardCharts';
import { getStoreInsights } from '../lib/geminiService';
import { OrderStatus, Order } from '../types';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    users: 0,
    inventory: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Revenue & Orders
      const { data: ordersData, error: ordersErr } = await supabase.from('orders').select('total, status');
      if (ordersErr) throw ordersErr;

      const totalRevenue = ordersData?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0;
      const totalOrders = ordersData?.length || 0;

      // 2. Fetch Profiles
      const { count: userCount, error: userErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (userErr) throw userErr;

      // 3. Fetch Products
      const { count: productCount, error: prodErr } = await supabase.from('products').select('*', { count: 'exact', head: true });
      if (prodErr) throw prodErr;

      // 4. Fetch Recent Orders
      const { data: recent, error: recentErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentErr) throw recentErr;

      setStats({
        revenue: totalRevenue,
        orders: totalOrders,
        users: userCount || 0,
        inventory: productCount || 0
      });

      if (recent) setRecentOrders(recent);
      
      // Auto-fetch insights based on real data
      if (totalOrders > 0 || productCount > 0) {
        const summary = `Revenue: $${totalRevenue.toFixed(2)}, Total Orders: ${totalOrders}, Users: ${userCount}, Inventory: ${productCount}.`;
        setLoadingInsights(true);
        const aiResponse = await getStoreInsights(summary);
        setInsights(aiResponse || "No enough data for AI deep-dive yet.");
        setLoadingInsights(false);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
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
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} trend={stats.revenue > 0 ? 12.5 : 0} icon={DollarSign} color="bg-indigo-500" />
        <MetricsCard title="Sales" value={`+${stats.orders}`} trend={stats.orders > 0 ? 8.2 : 0} icon={ShoppingCart} color="bg-purple-500" />
        <MetricsCard title="Active Users" value={stats.users.toString()} trend={stats.users > 0 ? 2.4 : 0} icon={Users} color="bg-pink-500" />
        <MetricsCard title="Inventory" value={`${stats.inventory} Items`} trend={0} icon={Package} color="bg-amber-500" />
      </div>

      {/* Main Content Area */}
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
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="pb-4 font-semibold">Customer</th>
                      <th className="pb-4 font-semibold">Status</th>
                      <th className="pb-4 font-semibold">Date</th>
                      <th className="pb-4 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 font-medium text-slate-200">{order.customer_name}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="py-4 text-right font-bold text-slate-200">${Number(order.total).toFixed(2)}</td>
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
