import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const panel = readFileSync(
  join(process.cwd(), "apps/web/components/dashboard/WonderSpaceDashboardPanel.tsx"),
  "utf8",
);

describe("dashboard workspace navigation", () => {
  it("routes Code to the full-page editor, not another workspace view", () => {
    expect(panel).toContain('tab === "code" && selected');
    expect(panel).toContain('/dashboard/projects/${encodeURIComponent(selected.id)}/files');
    expect(panel).not.toContain('id="workspace-code"');
    expect(panel).not.toContain("WonderSpaceInlineCodeManager");
  });

  it("preserves the separate More tools and History views", () => {
    expect(panel).toContain('activeTab === "tools"');
    expect(panel).toContain('id="workspace-tools"');
    expect(panel).toContain('activeTab === "history"');
    expect(panel).toContain("WonderSpaceSourceHistory");
  });

  it("tells users to open the full-page editor", () => {
    expect(panel).toContain("Select a project, open its full-page editor");
    expect(panel).toContain("Open full-page editor");
    expect(panel).toContain("Open project-specific tools without loading a second code editor.");
  });
});
