import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("customer-facing feedback and billing links",()=>{
  it("keeps feedback inside DreamMakerHub instead of the broken external redirect",()=>{
    const navbar=read("apps/web/components/Navbar.tsx");
    expect(navbar).toContain("href: '/dashboard/support'");
    expect(navbar).not.toContain("feedback.link/aiwonderlandinnovati");
    expect(navbar).not.toContain("invite.trustpilot.com");
  });

  it("does not expose the retired Manage in Stripe portal button",()=>{
    const billing=read("apps/web/components/billing/BillingAccountSections.tsx");
    expect(billing).not.toContain("Manage in Stripe");
    expect(billing).not.toContain('fetch("/api/subscription/portal"');
    expect(billing).toContain("Manage plan");
  });
});
