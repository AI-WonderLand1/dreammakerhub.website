import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderSpace navigation and translucent footer", () => {
  it("places the IDE project tabs below the site menu in place of the old info banner", () => {
    const layout = read("apps/web/app/(workspace)/dashboard/layout.tsx");
    const idePage = read("apps/web/app/(workspace)/dashboard/projects/[id]/ide/page.tsx");

    expect(layout).not.toContain('aria-label="Project breadcrumb"');
    expect(layout).not.toContain('<WonderSpaceProjectNavigation projectId={routeProjectId} active="ide" />');
    expect(layout).toContain('className="relative z-50 flex min-h-[72px]');
    expect(idePage).toContain('<WonderSpaceProjectNavigation projectId={projectId} active="ide" />');
    expect(idePage.indexOf('<WonderSpaceProjectNavigation')).toBeLessThan(
      idePage.indexOf('<WonderSpaceLaunch'),
    );
    expect(idePage).not.toContain('WonderSpace is an optional editor inside Edit / Design');
    expect(idePage).toContain('className="relative z-10 pt-4"');
    expect(layout).not.toContain('className="fixed inset-x-0 top-0 z-50');
    expect(layout).not.toContain('pt-[72px]');
    expect(idePage).toContain("<WonderSpaceLaunch projectId={projectId} />");
  });

  it("uses a translucent decorative footer without disabling its links", () => {
    const footer = read("apps/web/components/Footer.tsx");
    const routeFooter = read("apps/web/components/RouteAwareFooter.tsx");
    const vector = read("apps/web/components/ShatteredGlassVector.tsx");

    expect(footer).toContain("backdrop-blur-xl");
    expect(footer).toContain("bg-[#071326]/15");
    expect(footer).toContain("<ShatteredGlassVector />");
    expect(vector).toContain('<svg');
    expect(vector).toContain('aria-hidden="true"');
    expect(vector).toContain("pointer-events-none");
    expect(vector).toContain('fill="url(#glass-footer-facet)"');
    expect(vector).toContain('stroke="url(#glass-footer-crack)"');
    expect(vector).not.toContain("<image");
    expect(footer).toContain("TrustpilotReviewCollector");
    expect(footer).toContain("F6SFollowBadge");
    expect(routeFooter).toContain("wonderspace-galaxy.webp");
    expect(routeFooter).toContain('backgroundAttachment: "fixed"');
  });
});
