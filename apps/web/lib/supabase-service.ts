import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  logger.warn("[supabase-service] SUPABASE_SERVICE_ROLE_KEY not set — server-side operations will lack elevated permissions");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export function getClient() {
  return supabase;
}
