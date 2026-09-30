import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("canonical live usage and billing dashboard", () => {
  it("reads the real usage summary, real project API, and real Wonderland API keys", () => {
    const page = read("apps/web/app/(workspace)/dashboard/usage/page.tsx");
    expect(page).toContain('fetch("/api/usage"');
    expect(page).toContain('fetch("/api/keys"');
    expect(page).toContain('fetchAuthenticatedProject("/api/projects")');
    expect(page).toContain('"postgres_changes"');
    expect(page).toContain('table: "usage_logs"');
    expect(page).toContain('table: "user_profiles"');
    expect(page).not.toContain('.from("usage_quotas")');
    expect(page).not.toContain('.from("user_api_tokens")');
  });

  it("does not present parked full-IDE compute counters as active customer billing usage", () => {
    const page = read("apps/web/app/(workspace)/dashboard/usage/page.tsx");
    expect(page).toContain("Full Coder workspace, runtime-hour, and compute-credit limits are parked");
    expect(page).not.toContain(">Workspaces</span>");
    expect(page).not.toContain(">IDE Sessions</span>");
    expect(page).not.toContain(">Compute credits/mo</span>");
    expect(page).not.toContain(">Runtime hours/mo</span>");
  });

  it("redirects old billing surfaces into one canonical dashboard", () => {
    const subscription = read("apps/web/app/(workspace)/dashboard/subscription/page.tsx");
    const settingsBilling = read("apps/web/app/settings/billing/page.tsx");
    const settingsLayout = read("apps/web/app/(workspace)/dashboard/settings/layout.tsx");
    const settingsMenu = read("apps/web/app/(workspace)/dashboard/components/SettingsMenu.tsx");
    const portal = read("apps/web/app/api/subscription/portal/route.ts");

    expect(subscription).toContain('redirect("/dashboard/usage")');
    expect(settingsBilling).toContain('redirect("/dashboard/usage")');
    expect(settingsLayout).not.toContain('href: "/dashboard/subscription"');
    expect(settingsMenu).not.toContain('href="/dashboard/subscription"');
    expect(settingsMenu).toContain('href="/dashboard/usage"');
    expect(portal).toContain('return_url: `${baseUrl}/dashboard/usage`');
  });
});
