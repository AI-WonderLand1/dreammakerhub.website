import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('usage-first pricing contract', () => {
  it('keeps saved IDE and concurrent-session limits aligned with the public plans', () => {
    const limits = read('apps/web/lib/billing/limits.ts');
    expect(limits).toMatch(/plan: "free",[\s\S]*?workspacesLimit: 5,[\s\S]*?ideSessionsLimit: 2,[\s\S]*?aiTokensMonthly: 500000,[\s\S]*?runtimeHoursMonthly: 150,/);
    expect(limits).toMatch(/plan: "pro",[\s\S]*?workspacesLimit: 100,[\s\S]*?ideSessionsLimit: 4,[\s\S]*?aiTokensMonthly: 5000000,[\s\S]*?runtimeHoursMonthly: 300,/);
    expect(limits).toMatch(/plan: "team",[\s\S]*?workspacesLimit: 999999,[\s\S]*?ideSessionsLimit: 8,[\s\S]*?aiTokensMonthly: 25000000,[\s\S]*?runtimeHoursMonthly: 1000,/);
    expect(limits).toContain('"cloud_ide"');
  });

  it('does not treat workspace creation itself as the monthly billable unit', () => {
    const guard = read('apps/web/lib/billing/cost-guard.server.ts');
    const reserveStart = guard.indexOf('export async function reserveWorkspaceLaunch');
    const reserveBlock = guard.slice(reserveStart, reserveStart + 900);
    expect(reserveBlock).not.toContain("'workspace_launches'");
    expect(reserveBlock).toContain('PLAN_LIMITS[plan].workspacesLimit');
  });

  it('locks profile entitlement fields away from browser updates', () => {
    const migration = read('supabase/migrations/202609230330_plan_usage_security.sql');
    expect(migration).toContain('REVOKE UPDATE ON TABLE public.user_profiles FROM authenticated');
    expect(migration).toContain('GRANT UPDATE (full_name) ON TABLE public.user_profiles TO authenticated');
    expect(migration).toContain('p_limit NOT BETWEEN 1 AND 999999');
    expect(migration).toContain('coder_workspace_slots_unreleased_user_name');
  });
});

describe('Stripe entitlement contract', () => {
  it('derives paid access from the actual Stripe subscription price', () => {
    const webhook = read('apps/web/app/api/webhooks/stripe/route.ts');
    expect(webhook).toContain('function resolvedPaidPlan(subscription: Stripe.Subscription)');
    expect(webhook).toContain('price.id === plan.stripePriceId');
    expect(webhook).toContain('price.unit_amount === plan.price');
    expect(webhook).toContain('price.recurring.interval === "month"');
    expect(webhook).toContain('resolved.plan !== metadataPlan');
    expect(webhook).toContain('syncUserTier');
  });

  it('cancels at period end from the trusted subscriptions table', () => {
    const cancel = read('apps/web/app/api/subscription/cancel/route.ts');
    expect(cancel).toContain('.from("subscriptions")');
    expect(cancel).toContain('cancel_at_period_end: true');
    expect(cancel).not.toContain('.from("user_profiles")');
    expect(cancel).not.toContain('subscription_plan: "free"');
  });
});

describe('AI usage and memory contract', () => {
  it('meters the rich AI chat before invoking the model and ignores client plan headers', () => {
    const chat = read('apps/web/app/api/ai/chat/route.ts');
    const reserve = chat.indexOf('await reserveAiRequest(');
    const model = chat.indexOf('await runAIPipeline(');
    expect(reserve).toBeGreaterThan(0);
    expect(model).toBeGreaterThan(reserve);
    expect(chat).not.toContain('req.headers.get("x-plan")');
    expect(chat).toContain('const plan = billing.plan');
    expect(chat).toContain('isMem0ServiceEnabled()');
    expect(chat).toContain('archiveAiConversation({');
  });

  it('includes Team in paid Mem0 behavior and keeps MongoDB server-only and opt-in', () => {
    const config = read('apps/web/lib/ai/confessionConfig.ts');
    const mongo = read('apps/web/lib/ai/mongoMemory.server.ts');
    const pkg = read('package.json');
    expect(config).toContain('plan === "team"');
    expect(mongo).toContain("import 'server-only'");
    expect(mongo).toContain("process.env.MONGODB_AI_MEMORY_ENABLED === 'true'");
    expect(mongo).toContain('process.env.MONGODB_URI');
    expect(mongo).not.toContain('console.log');
    expect(pkg).toContain('"mongodb": "^7.6.0"');
  });
});
