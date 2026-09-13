import { createServerClient } from '@supabase/ssr';
import { createClient } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email?: string;
  isPaid: boolean;
  plan: string | null;
}

type RequestCookie = { name: string; value: string };

function parseCookieHeader(header: string | null): RequestCookie[] {
  if (!header) return [];
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf('=');
      if (separator < 0) return { name: part, value: '' };
      return {
        name: part.slice(0, separator).trim(),
        value: part.slice(separator + 1).trim(),
      };
    })
    .filter((cookie) => cookie.name.length > 0);
}

/**
 * Server-side auth for API routes.
 *
 * Current @supabase/ssr releases may store the session in chunked/base64
 * cookies (for example sb-...-auth-token.0/.1), so do not manually parse a
 * single auth-token cookie here. Let createServerClient reconstruct the same
 * cookie format the browser client writes.
 */
export async function requireUserId(req: Request): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id ?? null;
  }

  const requestCookies = parseCookieHeader(req.headers.get('cookie'));
  if (!requestCookies.length) return null;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      // API authorization only needs to read/verify the request session.
      // Session refresh is handled by the normal app middleware/auth flow.
      setAll() {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Client-side auth: fetch session from API route.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (!data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      isPaid: data.user.app_metadata?.plan === 'pro',
      plan: data.user.app_metadata?.plan ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error("Authentication required");
  return user;
}
