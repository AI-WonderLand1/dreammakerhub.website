import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public AI WONDERLAND membership catalog", () => {
  it("defines all six public memberships and the launch prices in one catalog", () => {
    const catalog = read("apps/web/lib/billing/public-plan-catalog.ts");
    for (const name of [
      "The Nomad",
      "The Creator",
      "The Architect",
      "The Studio",
      "The Guild",
      "The Architect of Worlds",
    ]) {
      expect(catalog).toContain(name);
    }
    expect(catalog).toContain('homepagePrice: "$19"');
    expect(catalog).toContain('homepagePrice: "$39"');
    expect(catalog).toContain('homepagePrice: "$79"');
    expect(catalog).toContain('homepagePrice: "$129"');
  });

  it("hides legacy free compute plans from public pricing until trial accounting exists", () => {
    const catalog = read("apps/web/lib/billing/public-plan-catalog.ts");
    const publicOrder = catalog.match(/export const PUBLIC_PLAN_ORDER:[\s\S]*?\];/)?.[0];
    expect(publicOrder).toBeTruthy();
    expect(publicOrder).not.toContain('"free"');
    for (const planId of ["creator", "pro", "studio", "team", "enterprise"]) {
      expect(publicOrder).toContain(`"${planId}"`);
    }
    // Retain the legacy plan in catalog for existing records; do not mislabel
    // those accounts as already having a real seven-day trial.
    expect(catalog).toContain('free: {');

    const subscription = read("apps/web/app/subscription/page.tsx");
    expect(subscription).toContain('7-day trial — coming soon');
    expect(subscription).not.toContain("ensureFree");
    expect(subscription).not.toContain('"Start free"');
    const homepage = read("apps/web/app/homepage/MockupHomepage.tsx");
    expect(homepage).toContain('7-day trial — coming soon');
    expect(homepage).not.toContain("Start Building Free");
  });

  it("drives homepage and subscription definitions from the shared public catalog", () => {
    const homepage = read("apps/web/app/homepage/data.ts");
    const plans = read("apps/web/lib/billing/plans.ts");
    expect(homepage).toContain("PUBLIC_PLAN_CATALOG");
    expect(homepage).toContain("PUBLIC_PLAN_ORDER");
    expect(plans).toContain("PUBLIC_PLAN_CATALOG");
    expect(plans).toContain("STRIPE_PRICE_ARCHITECT_ID");
    expect(plans).toContain("STRIPE_PRICE_GUILD_ID");
  });

  it("keeps internal compatibility plan IDs out of customer-facing billing labels", () => {
    const panel = read("apps/web/components/billing/BillingLiveUsagePanel.tsx");
    expect(panel).toContain("getPublicPlanDisplayName(plan)");
    expect(panel).toContain('"AI Credits"');
    expect(panel).not.toContain('"AI Tokens"');
    expect(panel).toContain('"Buy credits"');
  });

  it("shows the resolved membership name beside live Stripe subscriptions", () => {
    const route = read("apps/web/app/api/billing/account/route.ts");
    const account = read("apps/web/components/billing/BillingAccountSections.tsx");
    expect(route).toContain("membershipNameForPrice");
    expect(route).toContain("candidate.stripePriceId === priceId");
    expect(account).toContain('item.membership || "AI WONDERLAND membership"');
  });
});
