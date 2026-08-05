import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { logger } from '@/lib/logger';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    logger.warn('[supabase-server] Supabase credentials not available');
  }

  return { url, anonKey };
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
