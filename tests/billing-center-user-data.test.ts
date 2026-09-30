import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("billing center user ownership and reference layout", () => {
  it("uses real routed billing subpages instead of same-page anchor scrolling", () => {
    const layout = read("apps/web/app/(workspace)/dashboard/usage/layout.tsx");
    const sections = read("apps/web/components/billing/BillingAccountSections.tsx");
    expect(layout).toContain("<BillingCenterSidebar");
    expect(sections).toContain('"/dashboard/usage/metered"');
    expect(sections).toContain('"/dashboard/usage/ai"');
    expect(sections).toContain('"/dashboard/usage/alerts"');
    expect(sections).toContain('"/dashboard/usage/licensing"');
    expect(sections).toContain('"/dashboard/usage/payment-information"');
    expect(sections).toContain('"/dashboard/usage/payment-history"');
    expect(sections).toContain('"/dashboard/usage/additional-details"');
    expect(sections).not.toContain('"#billing-');
  });

  it("loads Stripe billing data only after resolving the authenticated user", () => {
    const route = read("apps/web/app/api/billing/account/route.ts");
    expect(route).toContain("authenticatedSupabaseUser(request)");
    expect(route).toContain('.eq("id", user.id)');
    expect(route).toContain('.eq("user_id", user.id)');
    expect(route).toContain("stripe.customers.retrieve(customerId)");
    expect(route).toContain("stripe.invoices.list({ customer: customerId");
    expect(route).toContain("stripe.subscriptions.list({ customer: customerId");
  });

  it("never embeds example personal billing identity from screenshots", () => {
    const page = read("apps/web/app/(workspace)/dashboard/usage/page.tsx");
    const live = read("apps/web/components/billing/BillingLiveUsagePanel.tsx");
    const sections = read("apps/web/components/billing/BillingAccountSections.tsx");
    const route = read("apps/web/app/api/billing/account/route.ts");
    const combined = page + live + sections + route;
    expect(combined).not.toContain("Michael Waite");
    expect(combined).not.toContain("Mikey");
    expect(combined).not.toContain("Marshall");
    expect(combined).not.toContain("7906");
    expect(combined).not.toContain("5554");
    expect(combined).not.toContain("realaiwonder");
  });

  it("exposes only safe card summary fields and Stripe-hosted invoice links", () => {
    const route = read("apps/web/app/api/billing/account/route.ts");
    expect(route).toContain("last4");
    expect(route).toContain("expMonth");
    expect(route).toContain("expYear");
    expect(route).toContain("hostedInvoiceUrl");
    expect(route).toContain("invoicePdf");
    expect(route).not.toContain("card.number");
    expect(route).not.toContain("card.cvc");
  });

  it("opens billing management for the authenticated user's canonical Stripe customer", () => {
    const portal = read("apps/web/app/api/subscription/portal/route.ts");
    expect(portal).toContain('.from("profiles")');
    expect(portal).toContain('.from("subscriptions")');
    expect(portal).toContain('.eq("user_id", userRes.user.id)');
    expect(portal).toContain("customer: customerId");
  });
});
