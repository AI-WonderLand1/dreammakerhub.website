import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Verified DreamMakerHub conversion events', () => {
  it('tracks only an authenticated and recently confirmed account', () => {
    const callback = read('apps/web/app/api/auth/callback/route.ts');
    expect(callback).toContain('await supabase.auth.exchangeCodeForSession(code)');
    expect(callback).toContain('supabase.auth.getUser()');
    expect(callback).toContain('user?.email_confirmed_at');
    expect(callback).toContain("trackFunnelEvent('Signup Completed', user.id, user.id)");
    expect(callback.indexOf('trackFunnelEvent(')).toBeGreaterThan(callback.indexOf('if (error) {'));
  });

  it('tracks a persisted project after creation, not the Create button', () => {
    const projects = read('apps/web/app/api/projects/route.ts');
    expect(projects).toContain('const project = await createProject(');
    expect(projects).toContain("await trackFunnelEvent('Project Created', userId, project.id)");
    expect(projects.indexOf('await trackFunnelEvent(')).toBeGreaterThan(projects.indexOf('const project = await createProject('));
    expect(read('apps/web/app/(workspace)/dashboard/page.tsx')).not.toContain("amplitude.track('Project Created'");
  });

  it('records workspace launch only after Coder reports a running IDE and the slot is attached', () => {
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    const transport = read('apps/web/lib/analytics/track-funnel-event.server.ts');
    expect(route).toContain("if (podType === 'ide' && workspace.status === 'running')");
    expect(route).toContain("await trackFunnelEvent('Workspace Launched', user.id, workspace.id");
    expect(route.indexOf("trackFunnelEvent('Workspace Launched'")).toBeGreaterThan(route.indexOf('await attachCoderWorkspace('));
    expect(transport).toContain("'Workspace Launched'");
    expect(read('apps/web/components/engines/WonderSpaceLaunch.tsx')).not.toContain("amplitude.track('Workspace Launched'");
  });

  it('tracks paid subscriptions only after signed payment confirmation and successful entitlement writes', () => {
    const webhook = read('apps/web/app/api/webhooks/stripe/route.ts');
    expect(webhook).toContain('stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)');
    expect(webhook).toMatch(/session\.payment_status === ['"]paid['"]/);
    expect(webhook).toMatch(/session\.status !== ['"]complete['"]/);
    expect(webhook).toContain('checkout.session.async_payment_succeeded');
    expect(webhook).toContain('stripe.subscriptions.retrieve(subscriptionId)');
    expect(webhook).toContain('await syncAuthPlan(supabase, userId, plan)');
    expect(webhook).toMatch(/trackFunnelEvent\(['"]Subscription Started['"], userId, subscriptionId\)/);
    const analyticsPosition = webhook.search(/trackFunnelEvent\(['"]Subscription Started['"]/);
    expect(analyticsPosition).toBeGreaterThan(webhook.indexOf('await syncAuthPlan(supabase, userId, plan)'));
  });

  it('does not expose the analytics key to the client or fail user operations on ingestion outages', () => {
    const transport = read('apps/web/lib/analytics/track-funnel-event.server.ts');
    expect(transport).toContain("import 'server-only'");
    expect(transport).toContain('process.env.AMPLITUDE_API_KEY || process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY');
    expect(transport).toContain('insert_id:');
    expect(transport).toContain('AbortSignal.timeout(3000)');
    expect(transport).toContain('catch {');
    expect(transport).not.toContain('console.log(apiKey)');
  });
});
