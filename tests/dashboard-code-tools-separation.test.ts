import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const panel = readFileSync(
  join(process.cwd(), "apps/web/components/dashboard/WonderSpaceDashboardPanel.tsx"),
  "utf8",
);

describe("dashboard workspace tabs", () => {
  it("renders Code and More tools as separate views", () => {
    expect(panel).toContain('hidden={activeTab !== "code"}');
    expect(panel).toContain('activeTab === "tools"');
    expect(panel).toContain('id="workspace-code"');
    expect(panel).toContain('id="workspace-tools"');
    expect(panel).not.toContain('hidden={activeTab !== "code" && activeTab !== "tools"}');
  });

  it("keeps Code mounted after first use without making More tools share it", () => {
    expect(panel).toContain("const [visitedCode, setVisitedCode]");
    expect(panel).toContain('if (activeTab === "code") setVisitedCode(true)');
    expect(panel).toContain("const codeMounted");
    expect(panel).not.toContain("visitedWorkbench");
    expect(panel).not.toContain("shared Code + More tools workbench");
  });

  it("explains the distinct views in the workspace UI", () => {
    expect(panel).toContain("Code, History and More tools each have their own view.");
    expect(panel).toContain("Open project-specific tools without loading the code editor.");
  });
});
