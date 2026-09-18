import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const auth = read('apps/web/app/public-pages/auth/page.tsx');
const callback = read('apps/web/app/api/auth/callback/route.ts');
const subscription = read('apps/web/app/subscription/page.tsx');
const pricing = read('apps/web/app/homepage/data.ts');

describe('new account plan selection', () => {
  it('routes generic registration to the existing subscription chooser, preserving destination', () => {
    expect(auth).toContain('function postSignupPath(redirectTo: string)');
    expect(auth).toContain('`/subscription?redirectTo=${encodeURIComponent(redirectTo)}`');
    expect(auth).toContain('return redirectTo;');
  });

  it('sends both original and resent confirmation links through the real session callback', () => {
    expect(auth).toContain("new URL('/api/auth/callback', window.location.origin)");
    expect(auth).toContain('options: { emailRedirectTo: confirmationCallbackUrl() }');
    expect(callback).toContain('exchangeCodeForSession(code)');
    expect(callback).toContain("requestUrl.searchParams.get('next')");
  });

  it('keeps the plan destination if email confirmation is opened in another browser', () => {
    expect(callback).toContain("url.searchParams.set('redirectTo', redirectTo)");
    expect(callback).toContain("authPageUrl(request, 'oauth_session_exchange_failed', redirectTo)");
    expect(callback).toContain("authPageUrl(request, 'oauth_code_missing', redirectTo)");
    expect(auth).toContain('window.location.href = redirectTo;');
  });

  it('allows explicit free choice and separate paid checkout, never charging during registration', () => {
    expect(subscription).toContain('return ensureFree()');
    expect(subscription).toContain('`/checkout?plan=${encodeURIComponent(plan.id)}');
    expect(auth).not.toContain('/api/subscription/subscribe');
    expect(pricing).toContain('href: "/public-pages/auth?signup=true"');
  });
});
