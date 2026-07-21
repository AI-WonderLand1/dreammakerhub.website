// Supabase client for Coder integration
// Isolated from main Supabase setup to avoid conflicts

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const createSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    logger.warn('[CoderClient] Missing Supabase environment variables');
    // Return a mock client that won't cause runtime errors
    return {
      from: () => ({
        upsert: async () => ({}),
        delete: async () => ({})
      })
    } as any;
  }
  
  return createClient(url, key);
};

export { createSupabaseClient };