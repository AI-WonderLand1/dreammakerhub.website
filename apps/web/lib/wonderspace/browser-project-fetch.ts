'use client';

import { createClient, ensureSupabaseConfig } from '@/lib/supabase/client';

/**
 * The existing Supabase project is the source of truth for browser IDE files.
 * This helper stays on the same-origin project API and passes the latest
 * customer Supabase access token when SSR cookies are missing at the proxy.
 */
export async function fetchAuthenticatedProject(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith('/api/projects/') || path.startsWith('//') || path.includes('\\')) {
    throw new Error('Only same-origin project API requests are allowed.');
  }
  await ensureSupabaseConfig();
  const supabase = createClient();
  const headers = new Headers(init.headers);
  // Refresh-prone tokens must be looked up before each save, not captured once
  // when the editor first opens. Server routes independently verify ownership.
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
