import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

export interface AuthUser {
  id: string;
  email?: string;
  isPaid: boolean;
  plan: string | null;
}

/**
 * Extract Supabase JWT from Authorization header or cookie.
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  if (cookieHeader) {
    const m = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (m) {
      try {
        return JSON.parse(decodeURIComponent(m[1])).access_token;
      } catch {}
    }
  }

  return null;
}

/**
 * Server-side auth: extract token, verify with Supabase, return userId or null.
 * Use in API routes: `const userId = await requireUserId(req); if (!userId) return unauthorized;`
 */
export async function requireUserId(req: Request): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const token = extractToken(req);
  if (!token) return null;

  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await sb.auth.getUser();
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
