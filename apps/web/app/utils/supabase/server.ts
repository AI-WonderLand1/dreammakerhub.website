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

  if (!url || !anonKey) {
    throw new Error('Supabase credentials not found in Oracle Vault');
  }

  cachedSupabaseUrl = url;
  cachedSupabaseAnonKey = anonKey;
  return { url, anonKey };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = await getSupabaseConfig();
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
  return createSupabaseServerClient();
}
