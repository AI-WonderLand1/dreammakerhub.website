import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("unified cross-repo billing and credit purchases",()=>{
  it("accepts only authenticated trusted product services for central reservations",()=>{
    const route=read("apps/web/app/api/internal/billing/reserve/route.ts");
    expect(route).toContain("DREAMMAKERHUB_INTERNAL_BILLING_KEY");
    expect(route).toContain("timingSafeEqual");
    expect(route).toContain('"ai-playground", "npc-ai-sim"');
    expect(route).toContain("authenticatedSupabaseUser(request)");
    expect(route).toContain("reserveBillableUnits");
    expect(route).toContain("evaluateUsageAlerts");
  });

  it("uses one authoritative ledger for main, playground and NPC usage",()=>{
    const migration=read("supabase/migrations/202610010010_cross_repo_usage_credits.sql");
    const usage=read("apps/web/app/api/usage/route.ts");
    expect(migration).toContain("'dreammakerhub','ai-playground','npc-ai-sim'");
    expect(migration).toContain("cross_repo_usage_events");
    expect(migration).toContain("reserve_billable_units_v2");
    expect(usage).toContain('from("billable_usage_counters")');
    expect(usage).toContain('from("cross_repo_usage_events")');
    expect(usage).toContain("purchased_render_credits");
  });

  it("spends included AI allowance first and purchased AI tokens only for overage",()=>{
    const migration=read("supabase/migrations/202610010010_cross_repo_usage_credits.sql");
    expect(migration).toContain("included_remaining := GREATEST");
    expect(migration).toContain("purchased_needed := GREATEST");
    expect(migration).toContain("purchased_tokens = purchased_tokens - purchased_needed");
  });

  it("grants render credits only from verified Stripe checkout and consumes them on provider-backed 3D generation",()=>{
    const webhook=read("apps/web/app/api/webhooks/stripe/route.ts");
    const renderRoute=read("apps/web/app/api/billing/render-credit-packs/route.ts");
    const hunyuan=read("apps/web/app/api/v1/3d/generate/route.ts");
    expect(renderRoute).toContain('kind: "render_credit_pack"');
    expect(renderRoute).toContain('price.type !== "one_time"');
    expect(webhook).toContain('session.metadata?.kind === "render_credit_pack"');
    expect(webhook).toContain('supabase.rpc("grant_purchased_render_credits"');
    expect(hunyuan).toContain('reserveBillableUnits(userId, "render_credits", 1, 0)');
    expect(hunyuan.indexOf('reserveBillableUnits(userId, "render_credits", 1, 0)')).toBeLessThan(hunyuan.indexOf("generateHunyuanGlb"));
  });

  it("renders AI and 3D purchase sliders from configured Stripe pack prices",()=>{
    const sliders=read("apps/web/components/billing/CreditPurchaseSliders.tsx");
    const renderPacks=read("apps/web/lib/billing/render-credit-packs.server.ts");
    const account=read("apps/web/components/billing/BillingAccountSections.tsx");
    expect(account).toContain("<CreditPurchaseSliders");
    expect(sliders).toContain('type="range"');
    expect(sliders).toContain("Amount");
    expect(sliders).toContain("Cost");
    expect(sliders).toContain("/api/billing/token-packs");
    expect(sliders).toContain("/api/billing/render-credit-packs");
    expect(renderPacks).toContain("RENDER_CREDIT_PACK_STARTER_UNITS");
    expect(renderPacks).toContain("STRIPE_RENDER_CREDIT_PACK_STARTER_PRICE_ID");
  });
});
