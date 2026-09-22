import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/app/utils/supabase/server';

/**
 * Resolve the authenticated Supabase user for a route request.
 *
 * Prefer the normal SSR cookie session. If the deployment/proxy has lost that
 * cookie while the browser still has a valid Supabase session, accept a
 * standard Bearer access token and verify it with Supabase before returning
 * the user. The raw token is never logged or persisted.
 */
export async function authenticatedSupabaseUser(request: Request): Promise<User | null> {
  const supabase = await createClient();

  const cookieResult = await supabase.auth.getUser();
  if (!cookieResult.error && cookieResult.data.user) {
    return cookieResult.data.user;
  }

  const authorization = request.headers.get('authorization')?.trim() || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const token = match?.[1]?.trim();
  if (!token) return null;

  const bearerResult = await supabase.auth.getUser(token);
  if (bearerResult.error || !bearerResult.data.user) return null;
  return bearerResult.data.user;
}
