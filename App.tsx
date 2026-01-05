
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ProductDrawer } from './components/ProductDrawer';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Login from './pages/Login';
import Settings from './pages/Settings';
import { useAuthStore, useUIStore } from './lib/store';
import { supabase, isSupabaseConfigured, withTimeout } from './lib/supabase';
import { ShieldAlert, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

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
          Your account is active but lacks <b>Admin</b> privileges. 
          Please contact your system administrator to update your role in the <code>profiles</code> table.
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
  const [initError, setInitError] = useState<string | null>(null);
  const [showBypass, setShowBypass] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Timeout to show bypass button if connection is really slow
    const bypassTimer = setTimeout(() => {
      if (isInitializing && isMounted) setShowBypass(true);
    }, 6000);

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (isMounted) setIsInitializing(false);
          return;
        }

        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 5000) as any;
        
        if (session?.user && isMounted) {
          try {
            const { data: profile } = await withTimeout(
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              3000
            ) as any;

            if (profile) {
              setAuth({
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                avatar_url: profile.avatar_url
              });
            } else {
              setAuth({
                id: session.user.id,
                name: session.user.user_metadata?.name || 'User',
                email: session.user.email || '',
                role: 'user',
                avatar_url: `https://i.pravatar.cc/150?u=${session.user.id}`
              });
            }
          } catch (pErr) {
            console.warn("Profile fetch failed, using session data.");
          }
        }
      } catch (err: any) {
        console.error("Auth init error:", err);
        if (isMounted) setInitError("Database connection is unresponsive.");
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuth(null);
      } else if (session?.user) {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || currentUser.id !== session.user.id) {
          try {
            const { data: profile } = await withTimeout(
              supabase.from('profiles').select('*').eq('id', session.user.id).single(),
              3000
            ) as any;

            if (profile && isMounted) {
              setAuth({
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                avatar_url: profile.avatar_url
              });
            }
          } catch (err) {
            console.warn("Background auth check failed, maintaining current session.");
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(bypassTimer);
    };
  }, [setAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-slate-400 font-medium animate-pulse">Establishing secure connection...</p>
        
        {showBypass && !initError && (
          <button 
            onClick={() => setIsInitializing(false)}
            className="mt-8 flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2"
          >
            <span>Proceed anyway</span>
            <ArrowRight size={16} />
          </button>
        )}

        {initError && (
          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm max-w-sm">
            <AlertTriangle className="mx-auto mb-2" size={20} />
            <p className="mb-3">{initError}</p>
            <div className="flex items-center justify-center space-x-4">
               <button onClick={() => window.location.reload()} className="underline font-bold">Retry</button>
               <button onClick={() => setIsInitializing(false)} className="bg-amber-500 text-slate-950 px-3 py-1 rounded-md text-xs font-bold">Bypass</button>
            </div>
          </div>
        )}
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

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
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
