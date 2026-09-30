import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("real-only dashboard navigation",()=>{
  it("hides unfinished project and IDE surfaces instead of showing disabled placeholders",()=>{
    const nav=read("apps/web/components/dashboard/WonderSpaceProjectNavigation.tsx");
    const layout=read("apps/web/app/(workspace)/dashboard/layout.tsx");
    const inline=read("apps/web/components/dashboard/WonderSpaceInlineCodeManager.tsx");
    const files=read("apps/web/app/(workspace)/dashboard/projects/[id]/files/page.tsx");
    expect(nav).not.toContain('label: "Changes"');
    expect(nav).not.toContain('label: "Actions"');
    expect(nav).not.toContain("aria-disabled");
    expect(layout).not.toContain("Cloud Linux IDE");
    expect(inline).not.toContain("BrowserTerminalPanel");
    expect(files).not.toContain("BrowserTerminalPanel");
  });

  it("keeps account and SimpleRick as real dashboard settings subpages",()=>{
    const layout=read("apps/web/app/(workspace)/dashboard/layout.tsx");
    const settings=read("apps/web/app/(workspace)/dashboard/settings/layout.tsx");
    expect(layout).toContain('href="/dashboard/settings/account"');
    expect(layout).toContain('href="/dashboard/settings/simplerick"');
    expect(settings).toContain('"/dashboard/settings/account"');
    expect(settings).toContain('"/dashboard/settings/simplerick"');
    expect(settings).not.toContain('"/dashboard/settings/coder"');
    expect(settings).not.toContain('"/dashboard/settings/byoc"');
  });

  it("uses routed billing pages, not scroll anchors",()=>{
    const sections=read("apps/web/components/billing/BillingAccountSections.tsx");
    expect(sections).toContain('"/dashboard/usage/metered"');
    expect(sections).toContain('"/dashboard/usage/payment-history"');
    expect(sections).not.toContain('"#billing-');
  });
});
