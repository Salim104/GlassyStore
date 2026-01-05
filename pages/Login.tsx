
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, Loader2, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { isSupabaseConfigured } from '../lib/supabase';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@glassystore.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const login = useAuthStore(state => state.login);
  const signUp = useAuthStore(state => state.signUp);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // If already logged in, redirect to dashboard immediately
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const result = await signUp(email, password, name);
        if (result?.error) {
          setError(result.error.message);
        } else {
          setMessage("Account created! You can now sign in. Note: Check your email if verification is required.");
          setIsSignUp(false);
        }
      } else {
        const result = await login(email, password);
        if (result?.error) {
          setError(result.error.message || "Invalid credentials. Please try again.");
        }
        // Success will trigger the Navigate check at the top on re-render
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md glass-panel p-10 rounded-3xl animate-in zoom-in-95 duration-500 shadow-2xl relative">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-indigo-600/10 text-indigo-400 mb-6 border border-indigo-600/20">
            {isSignUp ? <UserPlus size={40} /> : <ShieldCheck size={40} />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Create Admin Account' : 'GlassyStore Admin'}
          </h1>
          <p className="text-slate-400">
            {isSignUp ? 'Join the dashboard team' : 'Manage your high-performance storefront'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {isSignUp && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required={isSignUp}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="Your Name"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Forgot?</a>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-xl shadow-indigo-600/20 disabled:opacity-70 active:scale-[0.98] group"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />)}
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            {!isLoading && <ArrowRight size={18} className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="ml-1.5 text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
