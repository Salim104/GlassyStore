
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ProductDrawer } from './components/ProductDrawer';
import { ToastManager } from './components/Toast';
import { CommandCenter } from './components/CommandCenter';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Login from './pages/Login';
import Settings from './pages/Settings';
import { useAuthStore, useUIStore } from './lib/store';
import { supabase, isSupabaseConfigured, withTimeout, withRetry } from './lib/supabase';
import { ShieldAlert, Loader2, AlertTriangle, ArrowRight, Database, RefreshCw } from 'lucide-react';

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
      <CommandCenter />
      <ToastManager />
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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    // Show bypass option after 12 seconds of waiting (more patient for retries)
    const bypassTimer = setTimeout(() => {
      if (isInitializing && isMounted) setShowBypass(true);
    }, 12000);

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (isMounted) setIsInitializing(false);
          return;
        }

        // Use withRetry to handle multiple wake-up attempts.
        // Attempt 1 initiates wake-up, attempt 2/3 usually succeed.
        const sessionResult = await withRetry(
          () => withTimeout(supabase.auth.getSession(), 20000),
          3, // 3 retries total
          2000
        ) as any;
        
        const session = sessionResult.data?.session;
        
        if (session?.user && isMounted) {
          const { data: profile } = await withTimeout(
            supabase.from('profiles').select('*').eq('id', session.user.id).single(),
            10000
          ) as any;
          
          setAuth(profile ? { ...profile } : {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            email: session.user.email || '',
            role: 'user',
            avatar_url: `https://i.pravatar.cc/150?u=${session.user.id}`
          });
        }
      } catch (err: any) {
        console.error("Auth init error:", err);
        if (isMounted) {
          const isTimeout = err.message === 'Request timed out' || err.isTimeout;
          setInitError(isTimeout 
            ? "Multiple connection attempts timed out. Your database project might be having trouble waking up." 
            : "Establishing secure connection failed. Please check your network.");
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuth(null);
      } else if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile && isMounted) setAuth(profile);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(bypassTimer);
    };
  }, [setAuth, retryCount]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
          <Loader2 className="animate-spin text-indigo-500 relative z-10" size={56} />
        </div>
        
        <div className="space-y-4 max-w-sm">
          <h2 className="text-xl font-bold text-white tracking-tight">Authenticating</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Talking to the live database. We're retrying automatically if the connection is slow.
          </p>
        </div>
        
        {showBypass && !initError && (
          <div className="mt-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <button 
              onClick={() => setIsInitializing(false)}
              className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 text-sm font-bold bg-indigo-500/5 px-6 py-3 rounded-2xl border border-indigo-500/10 transition-all active:scale-95"
            >
              <Database size={16} />
              <span>Proceed to Mock Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {initError && (
          <div className="mt-8 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm max-w-sm animate-in zoom-in-95">
            <AlertTriangle className="mx-auto mb-3" size={24} />
            <p className="font-bold text-white mb-2">Connection Problem</p>
            <p className="mb-6 opacity-80">{initError}</p>
            <div className="flex items-center justify-center space-x-3">
               <button 
                 onClick={() => {
                   setInitError(null);
                   setIsInitializing(true);
                   setRetryCount(prev => prev + 1);
                 }} 
                 className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-950 px-4 py-3 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95"
               >
                 <RefreshCw size={14} />
                 Manual Retry
               </button>
               <button 
                 onClick={() => setIsInitializing(false)} 
                 className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl text-xs font-bold border border-white/10 transition-all"
               >
                 Bypass Auth
               </button>
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
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute>
          <div className="p-10 glass-panel rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Advanced Analytics</h2>
            <p className="text-slate-400">Deep-learning insights are being processed for your store.</p>
          </div>
        </ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
