import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { logger } from '@/lib/logger';

function getSupabaseConfig() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();

  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !anonKey) {
    logger.warn('[supabase-server] Supabase public credentials not available');
  }

  return { url, anonKey, serviceRoleKey };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseConfig();

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
          // Server Components cannot always write cookies. Route handlers and
          // server actions can, which is what OAuth/session mutation paths use.
        }
      },
    },
  });
}

export async function createClient() {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    logger.warn('[supabase-server] Credentials unavailable, returning stub client for build');
    return createServerClient('http://localhost', 'stub', {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }

  return createSupabaseServerClient();
}
