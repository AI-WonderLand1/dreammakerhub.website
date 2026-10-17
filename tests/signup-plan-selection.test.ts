import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const auth = read('apps/web/app/public-pages/auth/page.tsx');
const callback = read('apps/web/app/api/auth/callback/route.ts');
const subscription = read('apps/web/app/subscription/page.tsx');
const pricing = read('apps/web/lib/billing/public-plan-catalog.ts');
const homepage = read('apps/web/app/homepage/data.ts');
const checkoutStatus = read('apps/web/app/api/subscription/checkout-status/route.ts');

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

  it('offers separate paid checkout without activating permanent Free or charging at registration', () => {
    // Sign-up is non-billable; paid checkout requires a separate user action.
    expect(auth).not.toContain('/api/subscription/subscribe');
    expect(subscription).not.toContain('ensureFree');
    expect(subscription).toContain('/api/subscription/ensure');
    expect(subscription).toContain('/public-pages/auth?signup=true&redirectTo=');
    expect(subscription).toContain('if (id === "free" || id === "trial") return;');
    expect(subscription).toContain('14-day free trial');
    expect(subscription).toContain('["creator", "pro", "studio", "team", "enterprise"]');
    expect(subscription).toContain('`/checkout?plan=${encodeURIComponent(id)}&interval=${billingInterval}&redirectTo=${encodeURIComponent(redirectTo)}`');

    // Keep compatibility for existing account records.
    expect(pricing).toContain('id: "free"');
    expect(pricing).toContain('id: "pro"');
    expect(pricing).toContain('id: "team"');
    expect(pricing).toContain('href: "/subscription"');
    expect(homepage).toContain("PUBLIC_PLAN_CATALOG");
  });

  it('does not trust a success URL as proof of payment', () => {
    expect(subscription).toContain('Returning from Checkout does not activate a plan by itself.');
    expect(checkoutStatus).toContain('stripe.checkout.sessions.retrieve(sessionId)');
    expect(checkoutStatus).toContain('checkout.metadata.userId !== user.id');
  });
});
