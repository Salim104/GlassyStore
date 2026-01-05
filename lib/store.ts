
import { create } from 'zustand';
import { Profile } from '../types';
import { supabase, isSupabaseConfigured, withTimeout } from './supabase';
import { mockUsers } from './mockData';

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
  openDrawer: (type: 'add' | 'edit', data?: any) => void;
  closeDrawer: () => void;
  triggerRefresh: () => void;
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
      
      // Update local state
      set({ user: { ...currentUser, ...updates } });
      return { error: null };
    } catch (err: any) {
      console.error("Profile update error:", err);
      return { error: err };
    }
  },

  signUp: async (email, password, name) => {
    try {
      const { data, error } = await withTimeout(supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
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

      console.log("Attempting login for:", email);
      const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 8000) as any;
      
      if (error) {
        console.error("Supabase Auth Error:", error.message, error.status);
        return { error: { message: error.message || "Login failed. Check credentials or project status." } };
      }

      if (!data.user) return { error: { message: "User session could not be established." } };

      try {
        const { data: profile, error: profileError } = await withTimeout(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single(),
          4000
        ) as any;

        if (profileError || !profile) {
          console.warn("Profile fetch failed, defaulting to session metadata");
          throw new Error("No profile found");
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
      } catch (pErr) {
        set({
          isAuthenticated: true,
          user: {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            role: 'user',
            avatar_url: `https://i.pravatar.cc/150?u=${data.user.id}`
          }
        });
      }
      
      return { error: null };
    } catch (err: any) {
      console.error("Login critical catch:", err);
      return { error: { message: err.message || "Connection timed out. The database might be offline." } };
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
  refreshTrigger: 0,
  openDrawer: (type, data = null) => set({ isDrawerOpen: true, drawerType: type, drawerData: data }),
  closeDrawer: () => set({ isDrawerOpen: false, drawerType: null, drawerData: null }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
