import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Subscription pricing and checkout contract', () => {
  it('defines canonical monthly and annual USD prices in cents', () => {
    const plans = read('apps/web/lib/billing/plans.ts');
    expect(plans).toMatch(/id: "pro",[\s\S]*?price: 3900,[\s\S]*?yearlyPrice: 39000,/);
    expect(plans).toMatch(/id: "team",[\s\S]*?price: 12900,[\s\S]*?yearlyPrice: 129000,/);
  });

  it('publishes canonical plan data instead of the obsolete Elite and $10 Pro stubs', () => {
    const pricing = read('apps/web/app/api/subscription/pricing/route.ts');
    expect(pricing).toContain('PAID_PLANS');
    expect(pricing).toContain('amount: plan.price');
    expect(pricing).toContain('annualAmount: plan.yearlyPrice');
    expect(pricing).not.toContain('elite:');
    expect(pricing).not.toContain('amount: 1000');
    expect(pricing).not.toContain('amount: 2500');
    expect(pricing).toContain('"Cache-Control": "no-store"');
  });

  it('verifies the Stripe price before creating a hosted checkout session', () => {
    const checkout = read('apps/web/app/api/subscription/subscribe/route.ts');
    expect(checkout).toContain('await stripe.prices.retrieve(priceId)');
    expect(checkout).toContain('stripePrice.unit_amount !== expectedAmount');
    expect(checkout).toContain('stripePrice.currency !== "usd"');
    expect(checkout).toContain('stripePrice.recurring?.interval !== (isYearly ? "year" : "month")');
    expect(checkout.indexOf('stripe.prices.retrieve(priceId)')).toBeLessThan(checkout.indexOf('stripe.checkout.sessions.create({'));
  });
});
