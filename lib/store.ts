
import { create } from 'zustand';
import { Profile } from '../types';
import { supabase, isSupabaseConfigured, withTimeout } from './supabase';
import { mockUsers } from './mockData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  setAuth: (user: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isDrawerOpen: boolean;
  drawerType: 'add' | 'edit' | null;
  drawerData: any | null;
  refreshTrigger: number;
  commandPaletteOpen: boolean;
  toasts: ToastMessage[];
  openDrawer: (type: 'add' | 'edit', data?: any) => void;
  closeDrawer: () => void;
  triggerRefresh: () => void;
  setCommandPalette: (open: boolean) => void;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  setAuth: (user) => set({ user, isAuthenticated: !!user }),
  
  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return { error: { message: "No active user session" } };

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUser.id);
        
        if (error) throw error;
      }
      
      set({ user: { ...currentUser, ...updates } });
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  },

  signUp: async (email, password, name) => {
    try {
      const { data, error } = await withTimeout(supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      })) as any;
      
      if (error) return { error };
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || "Sign up failed" } };
    }
  },

  login: async (email, password) => {
    try {
      if (!isSupabaseConfigured()) {
        const mockAdmin = mockUsers.find(u => u.role === 'admin') || mockUsers[0];
        set({ isAuthenticated: true, user: { ...mockAdmin, email } });
        return { error: null };
      }

      const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 8000) as any;
      if (error) return { error: { message: error.message } };

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();

      set({
        isAuthenticated: true,
        user: profile ? { ...profile } : {
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          email: data.user.email || '',
          role: 'user',
          avatar_url: `https://i.pravatar.cc/150?u=${data.user.id}`
        }
      });
      
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || "Connection timed out." } };
    }
  },
  
  logout: async () => {
    try {
      if (isSupabaseConfigured()) await supabase.auth.signOut();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
}));

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  isDrawerOpen: false,
  drawerType: null,
  drawerData: null,
  refreshTrigger: 0,
  commandPaletteOpen: false,
  toasts: [],
  
  openDrawer: (type, data = null) => set({ isDrawerOpen: true, drawerType: type, drawerData: data }),
  closeDrawer: () => set({ isDrawerOpen: false, drawerType: null, drawerData: null }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
  setCommandPalette: (open) => set({ commandPaletteOpen: open }),
  
  addToast: (type, title, message) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, title, message }]
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
}));
