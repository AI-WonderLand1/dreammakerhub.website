import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("billing center token packs and usage alarms", () => {
  it("keeps one canonical dashboard with live billable usage, token purchases and alarm controls", () => {
    const page = read("apps/web/components/billing/BillingLiveUsagePanel.tsx");
    expect(page).toContain("Live metered usage for the current billing period.");
    expect(page).toContain("Buy AI credits");
    expect(page).toContain("Purchased AI credit balance");
    const alarms = read("apps/web/components/billing/UsageAlertsPanel.tsx");
    expect(alarms).toContain("Budgets & alerts");
    expect(alarms).toContain("New alarm");
    expect(alarms).toContain("3D generations");
    expect(alarms).toContain('fetch("/api/billing/alerts"');
    expect(page).toContain('fetch("/api/billing/token-packs"');
    const account = read("apps/web/components/billing/BillingAccountSections.tsx");
    expect(account).not.toContain('fetch("/api/subscription/portal"');
  });

  it("creates only configured one-time Stripe token checkouts owned by the authenticated user", () => {
    const route = read("apps/web/app/api/billing/token-packs/route.ts");
    expect(route).toContain("authenticatedSupabaseUser(request)");
    expect(route).toContain('mode: "payment"');
    expect(route).toContain('kind: "token_pack"');
    expect(route).toContain("client_reference_id: user.id");
    expect(route).toContain('price.type !== "one_time"');
    expect(route).toContain("resolveTokenPack");
  });

  it("grants paid token packs only from the signature-verified Stripe webhook and prevents double grants", () => {
    const webhook = read("apps/web/app/api/webhooks/stripe/route.ts");
    const migration = read("supabase/migrations/202609301830_billing_token_packs_alerts.sql");
    expect(webhook).toContain("stripe.webhooks.constructEvent");
    expect(webhook).toContain('session.metadata?.kind === "token_pack"');
    expect(webhook).toContain('session.payment_status !== "paid"');
    expect(webhook).toContain("stripe.checkout.sessions.listLineItems");
    expect(webhook).toContain('supabase.rpc("grant_purchased_ai_tokens"');
    // Database migration must parse before enabling server-side AI spending guards.
    expect(migration).toContain("DO $");
    expect(migration).toContain("END $;");
    expect(migration).not.toMatch(/\bDO \$(?!\$)/);
    expect(migration).toContain("stripe_checkout_session_id TEXT PRIMARY KEY");
    expect(migration).toContain("ON CONFLICT (stripe_checkout_session_id) DO NOTHING");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.grant_purchased_ai_tokens");
    expect(migration).toContain("TO service_role");
  });

  it("keeps dynamic alarms server-owned and exposes purchased balance through live usage", () => {
    const alerts = read("apps/web/app/api/billing/alerts/route.ts");
    const usage = read("apps/web/app/api/usage/route.ts");
    expect(alerts).toContain("authenticatedSupabaseUser(request)");
    expect(alerts).toContain('from("user_usage_alerts")');
    expect(alerts).toContain("three_d_generations");
    expect(alerts).toContain("destination_phone");
    expect(usage).toContain('from("user_token_balances")');
    expect(usage).toContain("purchased_tokens");
  });
});
