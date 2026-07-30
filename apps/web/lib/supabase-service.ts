import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

let _client: SupabaseClient | null = null;

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
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    );
  }
  return _client;
}

export async function signUpUser(email: string, password: string, fullName: string) {
  try {
    const client = getClient();
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
    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
  }
}

export async function subscribeToPlan(userId: string, plan: string) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('subscriptions')
      .upsert({ user_id: userId, plan, status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Subscription failed' };
  }
}
