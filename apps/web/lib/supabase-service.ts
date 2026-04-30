import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getOrCreateClient(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
}

export function getClient(): SupabaseClient | null {
  return getOrCreateClient();
}

const stubHandler = () => Promise.resolve({ data: null, error: new Error('Supabase not configured') });
const stub = new Proxy({} as any, {
  get: () => stubHandler,
});

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (prop === 'then' || prop === 'catch') return undefined;
    const client = getOrCreateClient();
    if (!client) return stub;
    return (client as any)[prop];
  },
});