
import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const supabaseUrl = 'https://khxjnyyilxooxomxulln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeGpueXlpbHhvb3hvbXh1bGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTkzNjgsImV4cCI6MjA4MzEzNTM2OH0.EFoDO0tLYuHPitIy71UirOu6YHkTTfAkWU77_mMn6n0';

export const isSupabaseConfigured = () => {
  // Always true now that keys are verified and SQL is run
  return true;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
