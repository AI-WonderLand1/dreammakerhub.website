import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderSpace IDE form navigation", () => {
  it("keeps the IDE inside the project Edit / Design flow", () => {
    const nav = read("apps/web/components/dashboard/WonderSpaceProjectNavigation.tsx");
    const project = read("apps/web/app/(workspace)/dashboard/projects/[id]/page.tsx");
    const ide = read("apps/web/app/(workspace)/dashboard/projects/[id]/ide/page.tsx");
    const layout = read("apps/web/app/(workspace)/dashboard/layout.tsx");

    expect(nav).toContain('label: "IDE"');
    expect(nav).toContain('${projectPath}/ide');
    expect(project).toContain("/ide");
    expect(project).toContain("Open IDE");
    expect(layout).not.toContain('<WonderSpaceProjectNavigation projectId={routeProjectId} active="ide" />');
    expect(ide).toContain('<WonderSpaceProjectNavigation projectId={projectId} active="ide" />');
    expect(ide).toContain("<WonderSpaceLaunch projectId={projectId} />");
    expect(ide).not.toContain("WonderSpace is an optional editor inside Edit / Design");
    expect(ide.indexOf('<WonderSpaceProjectNavigation')).toBeLessThan(ide.indexOf('<WonderSpaceLaunch'));
    expect(ide).toContain("/images/wonderspace-galaxy.webp");
  });
});
