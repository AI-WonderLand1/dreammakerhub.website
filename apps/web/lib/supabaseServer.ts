import { createSupabaseServerClient } from '@/app/utils/supabase/server';

let cachedClient: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;

async function getClient() {
  if (!cachedClient) {
    cachedClient = await createSupabaseServerClient();
  }
  return cachedClient;
}

export { getClient as supabaseServer, getClient as supabaseAdmin };
