
import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const supabaseUrl = 'https://khxjnyyilxooxomxulln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeGpueXlpbHhvb3hvbXh1bGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTkzNjgsImV4cCI6MjA4MzEzNTM2OH0.EFoDO0tLYuHPitIy71UirOu6YHkTTfAkWU77_mMn6n0';

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Wraps a promise with a timeout.
 * Useful for Supabase calls that might hang due to network issues.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
