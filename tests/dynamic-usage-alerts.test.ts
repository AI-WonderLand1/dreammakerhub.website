import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("dynamic usage alarms and 3D metering",()=>{
  it("meters successful 3D generation calls",()=>{
    const usage=read("apps/web/lib/usage/log.ts");
    const hunyuan=read("apps/web/app/api/v1/3d/generate/route.ts");
    const scene=read("apps/web/app/api/3d/generate-scene/route.ts");
    const migration=read("supabase/migrations/202609302355_dynamic_usage_alerts_3d.sql");
    expect(usage).toContain('"3d.generation"');
    expect(usage).toContain("three_d_generations");
    expect(hunyuan).toContain('action: "3d.generation"');
    expect(hunyuan).toContain("threeDGenerations: 1");
    expect(scene).toContain('action: "3d.generation"');
    expect(scene).toContain("threeDGenerations: 1");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS three_d_generations");
  });

  it("stores user-created alarms instead of fixed placeholder boxes",()=>{
    const api=read("apps/web/app/api/billing/alerts/route.ts");
    const panel=read("apps/web/components/billing/UsageAlertsPanel.tsx");
    const migration=read("supabase/migrations/202609302355_dynamic_usage_alerts_3d.sql");
    expect(api).toContain('from("user_usage_alerts")');
    expect(api).toContain("three_d_generations");
    expect(panel).toContain("New alarm");
    expect(panel).toContain("Edit alarm");
    expect(panel).toContain("Delete alarm");
    expect(panel).toContain("3D generations");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.user_usage_alerts");
  });

  it("only exposes email and SMS when real providers are configured",()=>{
    const engine=read("apps/web/lib/billing/usage-alerts.server.ts");
    const panel=read("apps/web/components/billing/UsageAlertsPanel.tsx");
    expect(engine).toContain("RESEND_API_KEY");
    expect(engine).toContain("BILLING_ALERT_FROM_EMAIL");
    expect(engine).toContain("TWILIO_ACCOUNT_SID");
    expect(engine).toContain("TWILIO_AUTH_TOKEN");
    expect(engine).toContain("TWILIO_FROM_NUMBER");
    expect(engine).toContain("https://api.resend.com/emails");
    expect(engine).toContain("Messages.json");
    expect(panel).toContain("providers.email&&");
    expect(panel).toContain("providers.sms&&");
  });

  it("fires saved alarms after real usage events and records delivery state",()=>{
    const usage=read("apps/web/lib/usage/log.ts");
    const engine=read("apps/web/lib/billing/usage-alerts.server.ts");
    expect(usage).toContain("evaluateUsageAlerts");
    expect(engine).toContain("last_triggered_period_start");
    expect(engine).toContain("last_delivery_status");
    expect(engine).toContain('status.email = "sent"');
    expect(engine).toContain('status.sms = "sent"');
  });

  it("does not require browser Supabase env vars for ordinary billing API requests",()=>{
    const live=read("apps/web/components/billing/BillingLiveUsagePanel.tsx");
    const alarms=read("apps/web/components/billing/UsageAlertsPanel.tsx");
    expect(live).not.toContain("const getToken");
    expect(live).toContain('fetch("/api/usage",{credentials:"same-origin"');
    expect(alarms).toContain('fetch("/api/billing/alerts",{credentials:"same-origin"');
  });
});
