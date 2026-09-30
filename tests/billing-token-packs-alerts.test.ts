import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("billing center token packs and usage alarms", () => {
  it("keeps one canonical dashboard with live billable usage, token purchases and alarm controls", () => {
    const page = read("apps/web/app/(workspace)/dashboard/usage/page.tsx");
    expect(page).toContain("Billable usage");
    expect(page).toContain("Buy AI tokens");
    expect(page).toContain("Purchased token balance");
    expect(page).toContain("Usage alarms");
    expect(page).toContain("Save alarm settings");
    expect(page).toContain('fetch("/api/billing/token-packs"');
    expect(page).toContain('fetch("/api/billing/preferences"');
    expect(page).toContain('fetch("/api/subscription/portal"');
    expect(page).not.toContain("Email alerts");
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
    expect(migration).toContain("stripe_checkout_session_id TEXT PRIMARY KEY");
    expect(migration).toContain("ON CONFLICT (stripe_checkout_session_id) DO NOTHING");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.grant_purchased_ai_tokens");
    expect(migration).toContain("TO service_role");
  });

  it("keeps alarm preferences server-owned and exposes purchased balance through live usage", () => {
    const prefs = read("apps/web/app/api/billing/preferences/route.ts");
    const usage = read("apps/web/app/api/usage/route.ts");
    expect(prefs).toContain("authenticatedSupabaseUser(request)");
    expect(prefs).toContain('from("user_billing_preferences")');
    expect(prefs).toContain("token_alert_percent");
    expect(prefs).toContain("storage_alert_percent");
    expect(usage).toContain('from("user_token_balances")');
    expect(usage).toContain("purchased_tokens");
  });
});
