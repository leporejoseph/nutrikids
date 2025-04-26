// Environment variable utilities

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return (
    !!import.meta.env.VITE_SUPABASE_URL && 
    !!import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

// Check if we should use local storage as a fallback
// This is useful for development or when Supabase isn't configured
export function useLocalStorageFallback(): boolean {
  return !isSupabaseConfigured() || 
    import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';
}