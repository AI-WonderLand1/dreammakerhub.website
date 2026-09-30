import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const layout = readFileSync(
  join(process.cwd(), "apps/web/app/(workspace)/dashboard/layout.tsx"),
  "utf8",
);

describe("reference-style dashboard side menus", () => {
  it("keeps the main hamburger menu and adds quick access without removing existing groups", () => {
    expect(layout).toContain('label: "Quick access"');
    expect(layout).toContain('label: "Home"');
    expect(layout).toContain('label: "Projects"');
    expect(layout).toContain('label: "Build"');
    expect(layout).toContain('label: "Code"');
    expect(layout).toContain('label: "3D"');
    expect(layout).toContain('label: "AI"');
    expect(layout).toContain('label: "Settings"');
  });

  it("uses real first-party routes for project issues, discussions and files", () => {
    expect(layout).toContain("/issues");
    expect(layout).toContain("/discussions");
    expect(layout).toContain("/files");
    expect(layout).toContain('"/dashboard#projects"');
  });

  it("replaces the reference Copilot settings concept with SimpleRickSettings", () => {
    expect(layout).toContain('label: "SimpleRickSettings"');
    expect(layout).toContain("<Sparkles size={16} /> SimpleRickSettings");
    expect(layout).toContain('href="/settings/ai-providers"');
    expect(layout).not.toContain(">Copilot<");
    expect(layout).not.toContain("Copilot settings");
  });

  it("renders the signed-in user account identity rather than hardcoded example identity", () => {
    expect(layout).toContain("{displayName}");
    expect(layout).toContain('{user.email || "Signed-in account"}');
    expect(layout).not.toContain("wonderingtribe");
    expect(layout).not.toContain("Michael Waite");
  });

  it("keeps sign out and account navigation inside the account menu", () => {
    expect(layout).toContain("> Profile");
    expect(layout).toContain("> Projects");
    expect(layout).toContain("> Teams & Organizations");
    expect(layout).toContain("> Billing & usage");
    expect(layout).toContain("> Upgrade");
    expect(layout).toContain('onClick={() => void handleSignOut()}');
  });
});
