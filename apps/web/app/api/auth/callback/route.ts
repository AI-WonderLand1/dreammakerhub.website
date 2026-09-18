import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard';

  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return '/dashboard';
  }

  return trimmed;
}

function authPageUrl(request: NextRequest, reason: string, redirectTo: string) {
  const url = new URL('/public-pages/auth', request.url);
  url.searchParams.set('error', reason);
  // A confirmation email can be opened on a different device without its PKCE
  // verifier. Let the user sign in normally without losing their selected plan.
  url.searchParams.set('redirectTo', redirectTo);
  return url;
}

function getSupabasePublicConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!url || !anonKey) {
    throw new Error('Supabase public credentials are unavailable in the OAuth callback runtime');
  }

  return { url, anonKey };
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = sanitizeRedirectPath(requestUrl.searchParams.get('next'));

  const providerError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
  if (providerError) {
    logger.error('[auth-callback] OAuth provider returned an error:', providerError);
    return NextResponse.redirect(authPageUrl(request, 'oauth_provider_error', redirectTo));
  }

  if (!code) {
    logger.error('[auth-callback] Missing OAuth authorization code');
    return NextResponse.redirect(authPageUrl(request, 'oauth_code_missing', redirectTo));
  }

  try {
    const { url, anonKey } = getSupabasePublicConfig();
    const successResponse = NextResponse.redirect(new URL(redirectTo, request.url));

    // Bind Supabase's PKCE/session cookies directly to the redirect response.
    // This avoids relying on a separately-created server client whose cookie
    // writes can be lost when the callback returns a new NextResponse.
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error('[auth-callback] Failed to exchange OAuth code for session:', error.message);
      return NextResponse.redirect(authPageUrl(request, 'oauth_session_exchange_failed', redirectTo));
    }

    return successResponse;
  } catch (error) {
    logger.error('[auth-callback] Unexpected OAuth callback failure:', error);
    return NextResponse.redirect(authPageUrl(request, 'oauth_callback_failed', redirectTo));
  }
}
