import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

let _client: SupabaseClient | null = null;

// The privileged client is shared across requests. Never let a user sign-in
// replace its service-role Authorization header with a user's session token.
const serverAuthOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
};

export function getClient(): SupabaseClient {
  if (!_client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      logger.warn("[supabase-service] NEXT_PUBLIC_SUPABASE_URL not set");
    }

    if (!supabaseServiceKey) {
      logger.warn("[supabase-service] SUPABASE_SERVICE_ROLE_KEY not set — server-side operations will lack elevated permissions");
    }

    _client = createClient(
      supabaseUrl || 'http://localhost:54321',
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      { auth: serverAuthOptions },
    );
  }
  return _client;
}

// Password-based user authentication must not run on the shared service-role
// client. Use an independent, unprivileged client for each request instead.
function userAuthClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase user authentication is not configured.');
  }
  return createClient(url, anonKey, { auth: serverAuthOptions });
}

export async function signUpUser(email: string, password: string, fullName: string) {
  try {
    const client = userAuthClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const client = userAuthClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
  }
}

/** @deprecated Client-side subscription writes must never grant paid access.
 * Use /subscription and the signed, server-verified Stripe checkout flow instead.
 * Kept as a fail-closed compatibility export for legacy callers.
 */
export async function subscribeToPlan(_userId: string, _plan: string) {
  return {
    success: false,
    error: 'Select a plan at /subscription. Paid access requires Stripe checkout confirmation.',
  };
}
