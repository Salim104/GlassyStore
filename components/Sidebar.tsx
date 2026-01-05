
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users as UsersIcon, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Globe
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../lib/store';

interface SidebarItemProps {
  to: string; 
  icon: any; 
  label: string; 
  active: boolean;
  collapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, active, collapsed }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' 
        : 'hover:bg-white/5 text-slate-400 hover:text-slate-100'
    }`}
  >
    <Icon size={20} className={active ? 'text-indigo-400' : 'group-hover:text-slate-100'} />
    {!collapsed && <span className="font-medium">{label}</span>}
  </Link>
);

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { logout, user } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/users', icon: UsersIcon, label: 'Users' },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-full glass-panel z-50 transition-all duration-500 ease-in-out ${
        sidebarOpen ? 'w-64' : 'w-20'
      } flex flex-col`}
    >
      <div className="p-6 flex items-center justify-between">
        {sidebarOpen && (
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">GlassyStore</h1>
            <div className="flex items-center space-x-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Live Database</span>
            </div>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <SidebarItem
            key={item.to}
            {...item}
            active={location.pathname === item.to}
            collapsed={!sidebarOpen}
          />
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5 space-y-4">
        {sidebarOpen && user && (
          <div className="px-2 py-3 bg-white/5 rounded-xl border border-white/5 mb-2">
            <div className="flex items-center space-x-3">
              <img src={user.avatar_url} className="w-8 h-8 rounded-full border border-white/10" alt="Profile" />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
        
        <SidebarItem to="/settings" icon={Settings} label="Settings" active={location.pathname === '/settings'} collapsed={!sidebarOpen} />
        <button
          onClick={logout}
          className={`flex items-center space-x-3 p-3 w-full text-left rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all duration-300 group`}
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
