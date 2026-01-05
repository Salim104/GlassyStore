
import { create } from 'zustand';
import { Profile } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockUsers } from './mockData';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  setAuth: (user: Profile | null) => void;
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
  openDrawer: (type: 'add' | 'edit', data?: any) => void;
  closeDrawer: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setAuth: (user) => set({ user, isAuthenticated: !!user }),
  
  signUp: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name } // Pass name to raw_user_meta_data for the SQL trigger
        }
      });
      
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

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };

      if (!data.user) return { error: { message: "User not found after login" } };

      // Wait a tiny bit for the SQL trigger to finish if this is a first-time login
      let profile = null;
      let profileError = null;
      
      const fetchProfile = async () => {
        const { data: p, error: e } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user!.id)
          .single();
        return { p, e };
      };

      const result = await fetchProfile();
      profile = result.p;
      profileError = result.e;

      if (profileError || !profile) {
        console.warn("Profile fetch failed, using auth metadata fallback:", profileError);
        set({
          isAuthenticated: true,
          user: {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            role: 'user', // Default to user if profile not found
            avatar_url: `https://i.pravatar.cc/150?u=${data.user.id}`
          }
        });
        return { error: null };
      }

      set({
        isAuthenticated: true,
        user: {
          id: profile.id,
          name: profile.name || 'Admin User',
          email: profile.email,
          role: profile.role || 'user',
          avatar_url: profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`
        }
      });
      
      return { error: null };
    } catch (err: any) {
      console.error("Login catch error:", err);
      return { error: { message: err.message || "An unexpected error occurred during login." } };
    }
  },
  
  logout: async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Logout error:", err);
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
  openDrawer: (type, data = null) => set({ isDrawerOpen: true, drawerType: type, drawerData: data }),
  closeDrawer: () => set({ isDrawerOpen: false, drawerType: null, drawerData: null }),
}));
