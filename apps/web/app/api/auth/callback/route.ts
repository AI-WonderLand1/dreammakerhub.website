import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/utils/supabase/server';
import { logger } from '@/lib/logger';

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard';

  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return '/dashboard';
  }

  return trimmed;
}

function authPageUrl(request: NextRequest, reason: string) {
  const url = new URL('/public-pages/auth', request.url);
  url.searchParams.set('error', reason);
  return url;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = sanitizeRedirectPath(requestUrl.searchParams.get('next'));

  const providerError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
  if (providerError) {
    logger.error('[auth-callback] OAuth provider returned an error:', providerError);
    return NextResponse.redirect(authPageUrl(request, 'oauth_provider_error'));
  }

  if (!code) {
    logger.error('[auth-callback] Missing OAuth authorization code');
    return NextResponse.redirect(authPageUrl(request, 'oauth_code_missing'));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error('[auth-callback] Failed to exchange OAuth code for session:', error.message);
      return NextResponse.redirect(authPageUrl(request, 'oauth_session_exchange_failed'));
    }

    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    logger.error('[auth-callback] Unexpected OAuth callback failure:', error);
    return NextResponse.redirect(authPageUrl(request, 'oauth_callback_failed'));
  }
}
