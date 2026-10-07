import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/app/utils/supabase/server';

/**
 * Resolve the authenticated Supabase user for a route request.
 *
 * When a same-origin client sends an Authorization bearer token, that token
 * represents the account that initiated this request and must take precedence
 * over any older SSR cookie still present in the browser. Verify the bearer
 * with Supabase and fail closed if it is invalid. Only fall back to the normal
 * SSR cookie session when no bearer token was supplied. The raw token is never
 * logged or persisted.
 */
export async function authenticatedSupabaseUser(request: Request): Promise<User | null> {
  const supabase = await createClient();

  const authorization = request.headers.get('authorization')?.trim() || '';
  if (authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    const token = match?.[1]?.trim();
    if (!token) return null;

    const bearerResult = await supabase.auth.getUser(token);
    if (bearerResult.error || !bearerResult.data.user) return null;
    return bearerResult.data.user;
  }

  const cookieResult = await supabase.auth.getUser();
  if (cookieResult.error || !cookieResult.data.user) return null;
  return cookieResult.data.user;
}
