import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const dashboard = read("apps/web/components/dashboard/WonderSpaceDashboardPanel.tsx");
const editor = read("apps/web/app/(workspace)/dashboard/projects/[id]/files/page.tsx");
const explorer = read("apps/web/app/(workspace)/dashboard/projects/[id]/RepositoryFileBrowser.tsx");

describe("one project code editor with unsaved work protection", () => {
  it("never mounts the redundant inline editor and routes legacy Code links to the canonical editor", () => {
    expect(dashboard).not.toContain("WonderSpaceInlineCodeManager");
    expect(dashboard).toContain('if (tab === "code" && selected)');
    expect(dashboard).toContain('if (requestedTab === "code")');
    expect(dashboard).toContain('/dashboard/projects/${encodeURIComponent(selected.id)}/files');
  });

  it("propagates dirty file changes to the full-page editor and warns before leaving", () => {
    expect(explorer).toContain("onUnsavedChange?.(unsaved)");
    expect(editor).toContain("onUnsavedChange={reportUnsaved}");
    expect(editor).toContain("unsavedRef.current = unsaved");
    expect(editor).toContain('window.addEventListener("beforeunload", beforeUnload)');
    expect(editor).toContain('document.addEventListener("click", confirmNavigation, true)');
    expect(editor).toContain('window.addEventListener("popstate", onBack, true)');
    expect(editor).toContain('event.stopImmediatePropagation()');
    expect(editor).toContain("You have unsaved changes. Leave this editor and discard them?");
  });

  it("requires explicit confirmation before switching to another file or folder", () => {
    expect(explorer).toContain('const allowDiscard = () => {');
    expect(explorer).toContain("You have unsaved changes to this file. Discard them?");
    expect(explorer).toContain('if (selectedPath === path || !allowDiscard()) return;');
    expect(explorer).toContain('if (!allowDiscard()) return;');
  });
});
