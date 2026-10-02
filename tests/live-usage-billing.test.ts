import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("canonical live usage and billing dashboard", () => {
  it("reads live usage from the routed metered panel using real project and key APIs", () => {
    const page = read("apps/web/components/billing/BillingLiveUsagePanel.tsx");
    expect(page).toContain('fetch("/api/usage"');
    expect(page).toContain('fetch("/api/keys"');
    expect(page).toContain('fetchAuthenticatedProject("/api/projects")');
    expect(page).toContain('"postgres_changes"');
    expect(page).toContain('table:"usage_logs"');
    expect(page).toContain('table:"user_token_balances"');
    expect(page).not.toContain('.from("usage_quotas")');
    expect(page).not.toContain('.from("user_api_tokens")');
  });

  it("does not present parked full-IDE compute counters as active customer billing usage", () => {
    const page = read("apps/web/components/billing/BillingLiveUsagePanel.tsx");
    expect(page).not.toContain(">Workspaces</span>");
    expect(page).not.toContain(">IDE Sessions</span>");
    expect(page).not.toContain(">Compute credits/mo</span>");
    expect(page).not.toContain(">Runtime hours/mo</span>");
    expect(page).not.toContain("Coder workspace");
  });

  it("redirects old billing surfaces into one canonical dashboard", () => {
    const nextConfig = read("apps/web/next.config.mjs");
    const settingsLayout = read("apps/web/app/(workspace)/dashboard/settings/layout.tsx");
    const settingsMenu = read("apps/web/app/(workspace)/dashboard/components/SettingsMenu.tsx");
    const portal = read("apps/web/app/api/subscription/portal/route.ts");

    expect(nextConfig).toContain("source: '/settings/billing'");
    expect(nextConfig).toContain("source: '/settings/subscriptions'");
    expect(nextConfig).toContain("source: '/dashboard/subscription'");
    expect(nextConfig.match(/destination: '\/dashboard\/usage'/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(settingsLayout).not.toContain('href: "/dashboard/subscription"');
    expect(settingsMenu).not.toContain('href="/dashboard/subscription"');
    expect(settingsMenu).toContain('["/dashboard/usage","Usage & Billing"]');
    expect(portal).toContain('return_url: `${baseUrl}/dashboard/usage`');
  });
});
