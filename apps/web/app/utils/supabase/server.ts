import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { logger } from '@/lib/logger';
import { getSecretFromVault } from '@/lib/oracle-vault';

let cachedSupabaseUrl: string | null = null;
let cachedSupabaseAnonKey: string | null = null;

async function getSupabaseConfig() {
  if (cachedSupabaseUrl && cachedSupabaseAnonKey) {
    return { url: cachedSupabaseUrl, anonKey: cachedSupabaseAnonKey };
  }

  const [url, anonKey] = await Promise.all([
    getSecretFromVault('NEXT_PUBLIC_SUPABASE_URL'),
    getSecretFromVault('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  ]);

  cachedSupabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  cachedSupabaseAnonKey = anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;

  if (!cachedSupabaseUrl || !cachedSupabaseAnonKey) {
    logger.warn('[supabase-server] Supabase credentials not available — using fallback');
  }

  return { url: cachedSupabaseUrl || '', anonKey: cachedSupabaseAnonKey || '' };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = await getSupabaseConfig();
  if (!url || !anonKey) {
    return createServerClient('http://localhost', 'stub', {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // ignore in middleware / render
        }
      },
    },
  });
}

export async function createClient() {
  const { url, anonKey } = await getSupabaseConfig();
  if (!url || !anonKey) {
    logger.warn('[supabase-server] Credentials unavailable, returning stub client for build');
    return createServerClient('http://localhost', 'stub', {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }
  return createSupabaseServerClient();
}
