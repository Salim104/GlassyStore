
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ProductDrawer } from './components/ProductDrawer';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Login from './pages/Login';
import { useAuthStore, useUIStore } from './lib/store';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { ShieldAlert, Loader2, WifiOff } from 'lucide-react';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarOpen } = useUIStore();
  
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <Sidebar />
      <main 
        className={`flex-1 transition-all duration-500 ease-in-out p-4 md:p-8 pt-20 md:pt-8 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {!isSupabaseConfigured() && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center space-x-3">
            <WifiOff size={18} />
            <span>Backend is currently using mock data. Connect Supabase keys for full persistence.</span>
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ProductDrawer />
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 rounded-full bg-rose-500/10 text-rose-500 mb-6">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-slate-400 max-w-md mb-8">
          Your account does not have administrative privileges. Please contact the system administrator to request access.
        </p>
        <button 
          onClick={() => useAuthStore.getState().logout()}
          className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3 rounded-xl font-semibold transition-all"
        >
          Logout & Return
        </button>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
};

const App = () => {
  const { setAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setIsInitializing(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setAuth({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              avatar_url: profile.avatar_url
            });
          }
        }
      } catch (err) {
        console.warn("Auth initialization failed, likely network error or missing keys:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setAuth({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              avatar_url: profile.avatar_url
            });
          }
        } else {
          setAuth(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [setAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={48} />
          <p className="text-slate-400 font-medium animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <div className="p-10 glass-panel rounded-2xl text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Advanced Analytics</h2>
              <p className="text-slate-400">Deep-learning insights are being processed for your store.</p>
            </div>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
