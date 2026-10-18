import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')
  );
}

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!isSupabaseConfigured()) {
    // Mode dégradé si non configuré
    return null;
  }

  if (typeof window !== 'undefined') {
    if (!browserClientInstance) {
      browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return browserClientInstance;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
