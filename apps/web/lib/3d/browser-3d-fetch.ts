'use client';

import { createClient, ensureSupabaseConfig } from '@/lib/supabase/client';

/**
 * Same-origin 3D API helper. Access tokens are obtained per request so
 * customer sessions still work when an edge proxy has not forwarded SSR cookies.
 * Every server route must independently verify identity and asset ownership.
 */
export async function fetchAuthenticated3D(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith('/api/v1/3d/') || path.startsWith('//') || path.includes('\\')) {
    throw new Error('Only same-origin 3D API requests are allowed.');
  }

  await ensureSupabaseConfig();
  const supabase = createClient();
  const headers = new Headers(init.headers);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  }

  return fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
  });
}
