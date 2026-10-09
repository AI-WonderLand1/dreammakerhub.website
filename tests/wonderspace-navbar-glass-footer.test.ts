import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderSpace navigation and translucent footer", () => {
  it("places the project IDE tabs above the site menu without a floating overlay", () => {
    const layout = read("apps/web/app/(workspace)/dashboard/layout.tsx");
    const idePage = read("apps/web/app/(workspace)/dashboard/projects/[id]/ide/page.tsx");

    expect(layout).toContain("const isProjectIdeRoute = ");
    expect(layout).toContain('aria-label="Project breadcrumb"');
    expect(layout).toContain('<WonderSpaceProjectNavigation projectId={routeProjectId} active="ide" />');
    expect(layout.indexOf('aria-label="Project breadcrumb"')).toBeLessThan(layout.indexOf("<header className="));
    expect(layout).not.toContain('className="fixed inset-x-0 top-0 z-50');
    expect(layout).not.toContain('pt-[72px]');
    expect(idePage).not.toContain("<WonderSpaceProjectNavigation");
    expect(idePage).toContain("<WonderSpaceLaunch projectId={projectId} />");
  });

  it("uses a translucent decorative footer without disabling its links", () => {
    const footer = read("apps/web/components/Footer.tsx");
    const routeFooter = read("apps/web/components/RouteAwareFooter.tsx");

    expect(footer).toContain("backdrop-blur-xl");
    expect(footer).toContain("bg-[#071326]/25");
    expect(footer).toContain('className="pointer-events-none absolute');
    expect(footer).toContain("clipPath:");
    expect(footer).toContain("TrustpilotReviewCollector");
    expect(footer).toContain("F6SFollowBadge");
    expect(routeFooter).toContain("wonderspace-galaxy.webp");
    expect(routeFooter).toContain('backgroundAttachment: "fixed"');
  });
});
