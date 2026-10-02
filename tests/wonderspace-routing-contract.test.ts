import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderSpace routing contract", () => {
  it("keeps project-specific routes on the selected DreamMakerHub project", () => {
    const routes = read("apps/web/lib/wonderspace/routes.ts");
    const entry = read("apps/web/app/wonderspace/page.tsx");
    const browser = read("apps/web/app/wonderspace/browser/page.tsx");
    const ide = read("apps/web/app/wonderspace/ide/page.tsx");
    const projectIde = read("apps/web/app/(workspace)/dashboard/projects/[id]/ide/page.tsx");

    expect(routes).toContain("/dashboard/projects/");
    expect(routes).toContain("/files");
    expect(routes).toContain("/ide");
    expect(routes).toContain("WONDERSPACE_CODE_HOME");

    expect(entry).toContain("normalizeWonderSpaceProjectId");
    expect(entry).toContain("wonderSpaceProjectHub");
    expect(browser).toContain("wonderSpaceProjectFiles");
    expect(ide).toContain("wonderSpaceProjectIde");
    expect(projectIde).toContain("<WonderSpaceLaunch projectId={projectId} />");
  });

  it("does not route a selected code project through the generic WonderSpace entry", () => {
    const customerLaunch = read("apps/web/components/engines/CustomerWorkspaceLaunch.tsx");
    const navigation = read("apps/web/lib/navigation.ts");
    const dashboardLayout = read("apps/web/app/(workspace)/dashboard/layout.tsx");

    expect(customerLaunch).toContain("/dashboard/projects/");
    expect(customerLaunch).not.toContain("return `/wonderspace?${query}`");
    expect(navigation).toContain('workspace: "/dashboard?workspaceTab=code#projects"');
    expect(navigation).toContain('code: "/dashboard?workspaceTab=code#projects"');
    expect(dashboardLayout).toContain("/dashboard/projects/${encodeURIComponent(currentProject.id)}/files");
  });

  it("keeps old WonderSpace aliases as compatibility redirects without dropping projectId", () => {
    for (const path of [
      "apps/web/app/wonderspace/ide/page.tsx",
      "apps/web/app/wonderspace/on-demand/page.tsx",
      "apps/web/app/wonderspace/workspaces/page.tsx",
      "apps/web/app/coder-workspace/page.tsx",
      "apps/web/app/(tools)/ide/page.tsx",
      "apps/web/app/(workspace)/dashboard/settings/coder/page.tsx",
    ]) {
      const source = read(path);
      expect(source).toContain("normalizeWonderSpaceProjectId");
      expect(source).toContain("wonderSpaceProjectIde");
      expect(source).toContain("WONDERSPACE_CODE_HOME");
    }
  });
});
