
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
 * Useful for Supabase calls that might hang due to network issues or cold starts.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error('Request timed out');
      (error as any).isTimeout = true;
      reject(error);
    }, timeoutMs);
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

/**
 * Retries a function that returns a promise.
 * Useful for handling transient failures during database wake-up.
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  retries: number = 2, 
  delay: number = 1500
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    // If it's a timeout, wait a bit before retrying as the DB might be waking up
    const waitTime = error.isTimeout ? delay * 2 : delay;
    console.warn(`Attempt failed, retrying in ${waitTime}ms... (${retries} retries left)`);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}
