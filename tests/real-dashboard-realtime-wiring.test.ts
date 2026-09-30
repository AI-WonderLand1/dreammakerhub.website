import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("real dashboard wiring and realtime contracts", () => {
  it("keeps project issues, discussions and wiki wired to project realtime invalidation", () => {
    const panel = read("apps/web/components/dashboard/WonderSpaceWorkItemsPanel.tsx");
    const wiki = read("apps/web/app/(workspace)/dashboard/projects/[id]/wiki/page.tsx");
    const hook = read("apps/web/lib/wonderspace/use-project-realtime-invalidation.ts");

    expect(panel).toContain("useProjectRealtimeInvalidation");
    expect(panel).toContain('kind === "issue" ? "issues" : "discussions"');
    expect(panel).toContain("await announceChange()");
    expect(wiki).toContain('useProjectRealtimeInvalidation(projectId, "wiki"');
    expect(wiki).toContain("await announceWikiChange()");
    expect(hook).toContain('event: "project-data-changed"');
    expect(hook).toContain("broadcast: { self: false");
  });

  it("makes collaboration owner-scoped and realtime instead of accepting arbitrary project access", () => {
    const route = read("apps/web/app/api/collaboration/route.ts");
    const page = read("apps/web/app/(workspace)/dashboard/collaboration/page.tsx");
    const migration = read("supabase/migrations/202609302315_realtime_collaboration_sessions.sql");

    expect(route).toContain('.eq("owner_id", userId)');
    expect(route).toContain('.eq("project_id", projectId)');
    expect(route).toContain('onConflict: "project_id,user_id"');
    expect(page).toContain('fetchAuthenticatedProject("/api/projects")');
    expect(page).toContain('table: "collaboration_sessions"');
    expect(page).toContain('filter: `project_id=eq.${projectId}`');
    expect(page).not.toContain('placeholder="Enter project ID"');
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("supabase_realtime ADD TABLE public.collaboration_sessions");
  });

  it("returns only working platform options and removes beta runner/terminal stubs", () => {
    const route = read("apps/web/app/api/platform/options/route.ts");
    expect(route).not.toContain('"beta"');
    expect(route).not.toContain("Project Runner API");
    expect(route).not.toContain("Terminal Exec");
    expect(route).toContain('"/dashboard/editor-playcanvas"');
    expect(route).toContain('"/dashboard/collaboration"');
    expect(route).toContain('"/dashboard/aetherguard"');
  });

  it("does not send Dashboard AI quick actions to dead routes", () => {
    const ai = read("apps/web/components/ai/DashboardAI.tsx");
    expect(ai).toContain("href: '/dashboard#projects'");
    expect(ai).toContain("href: '/dashboard/usage/metered'");
    expect(ai).toContain("https://playground.dreammakerhub.website/");
    expect(ai).not.toContain("href: '/dashboard/projects'");
    expect(ai).not.toContain("href: '/dashboard/analytics'");
  });

  it("redirects retired customer IDE and scaffold routes to working dashboard surfaces", () => {
    const routes = [
      "apps/web/app/(workspace)/dashboard/settings/coder/page.tsx",
      "apps/web/app/(workspace)/dashboard/settings/byoc/page.tsx",
      "apps/web/app/(workspace)/dashboard/teams/page.tsx",
      "apps/web/app/wonderspace/ide/page.tsx",
      "apps/web/app/wonderspace/on-demand/page.tsx",
      "apps/web/app/wonderspace/workspaces/page.tsx",
      "apps/web/app/coder-workspace/page.tsx",
      "apps/web/app/(tools)/ide/page.tsx",
    ].map(read).join("\n");

    expect(routes).not.toContain("Create Workspace");
    expect(routes).not.toContain("Connection test passed");
    expect(routes).not.toContain("Customer IDE opening is temporarily paused");
    expect(routes).toContain('redirect("/dashboard?workspaceTab=code")');
    expect(routes).toContain('redirect("/dashboard/collaboration")');
    expect(routes).toContain('redirect("/dashboard/settings")');
  });
});
