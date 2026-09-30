// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const shared = vi.hoisted(() => ({
  url: "http://localhost/dashboard?projectId=first",
  replace: vi.fn(),
  editorMounts: 0,
  onCreate: vi.fn(),
  reportDirty: null as null | ((projectId: string, dirty: boolean) => void),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: shared.replace }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URL(shared.url).searchParams,
}));
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({ href, children }: { href: string; children: ReactNode }) =>
      React.createElement("a", { href }, children),
  };
});
vi.mock("../apps/web/components/dashboard/WonderSpaceInlineCodeManager", async () => {
  const React = await import("react");
  return {
    default: ({ project, embedded, onDirtyChange }: { project: { id: string } | null; embedded?: boolean; onDirtyChange?: (id: string, dirty: boolean) => void }) => {
      shared.reportDirty = onDirtyChange || null;
      React.useEffect(() => {
        shared.editorMounts += 1;
      }, []);
      return React.createElement("div", {
        "data-testid": "real-editor-mount",
        "data-project-id": project?.id || "",
        "data-embedded": String(embedded),
      });
    },
  };
});
vi.mock("../apps/web/components/dashboard/WonderSpaceSourceHistory", async () => {
  const React = await import("react");
  return {
    default: ({ projectId, hasUnsavedEdits }: { projectId: string; hasUnsavedEdits?: boolean }) =>
      React.createElement("div", { "data-testid": "source-history", "data-project-id": projectId, "data-unsaved": String(hasUnsavedEdits) }),
  };
});
vi.mock("../apps/web/components/dashboard/WonderSpaceProjectNavigation", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "advanced-tools" }) };
});

import WonderSpaceDashboardPanel from "../apps/web/components/dashboard/WonderSpaceDashboardPanel";

const projects = [
  { id: "first", name: "First website", tool: "wonderbuild" },
  { id: "second", name: "Second site", tool: "wonderbuild" },
];
let container: HTMLDivElement;
let root: Root;
const p = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

async function renderPanel(rows = projects) {
  await act(async () => {
    root.render(<WonderSpaceDashboardPanel projects={rows} requestedProjectId={
      new URL(shared.url).searchParams.get("projectId")
    } onCreate={shared.onCreate} />);
  });
}
function workspaceButton(label: string) {
  const button = [...container.querySelectorAll('nav[aria-label="Project workspace views"] button')]
    .find(item => item.textContent?.trim() === label);
  if (!button) throw Error(`Workspace tab "${label}" missing`);
  return button as HTMLButtonElement;
}
async function chooseTab(label: string) {
  await act(async () => {
    workspaceButton(label).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await renderPanel();
}

beforeEach(() => {
  vi.resetAllMocks();
  shared.url = "http://localhost/dashboard?projectId=first";
  shared.editorMounts = 0;
  shared.reportDirty = null;
  shared.replace.mockImplementation((url: string) => {
    shared.url = new URL(url, "http://localhost").toString();
  });
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  vi.unstubAllGlobals();
});

describe("one-page project workspace", () => {
  it("has only one project picker and four in-place views, with no eager editor download", async () => {
    await renderPanel();
    expect(container.querySelectorAll("select")).toHaveLength(1);
    expect([...container.querySelectorAll('nav[aria-label="Project workspace views"] button')]
      .map(x => x.textContent?.trim())).toEqual(["Overview", "Code", "History", "More tools"]);
    expect(container.textContent).toContain("First website");
    expect(container.querySelector('[data-testid="real-editor-mount"]')).toBeNull();
    expect(container.querySelector('[data-testid="source-history"]')).toBeNull();
    expect(container.querySelector('a[href="/wonder-build/builder?projectId=first"]')).toBeTruthy();
  });

  it("opens the real embedded editor on the Code tab without a second launch button", async () => {
    await renderPanel();
    await chooseTab("Code");
    const editor = container.querySelector('[data-testid="real-editor-mount"]');
    expect(editor?.getAttribute("data-project-id")).toBe("first");
    expect(editor?.getAttribute("data-embedded")).toBe("true");
    expect(shared.url).toContain("workspaceTab=code");
    expect(shared.editorMounts).toBe(1);
    expect(container.textContent).not.toContain("Open code here");
  });

  it("retains a mounted code editor on History and More tabs to protect in-memory edits", async () => {
    await renderPanel();
    await chooseTab("Code");
    const editor = container.querySelector('[data-testid="real-editor-mount"]');
    await chooseTab("History");
    expect(container.querySelector('[data-testid="source-history"]')).toBeTruthy();
    expect(editor?.parentElement?.hasAttribute("hidden")).toBe(true);
    await chooseTab("More tools");
    expect(container.querySelector('[data-testid="advanced-tools"]')).toBeTruthy();
    await chooseTab("Code");
    expect(shared.editorMounts).toBe(1);
    expect(container.querySelector('[data-testid="real-editor-mount"]')).toBe(editor);
  });

  it("switches project and returns to Overview without exposing the previous editor", async () => {
    await renderPanel();
    await chooseTab("Code");
    const dropdown = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      dropdown.value = "second";
      dropdown.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await renderPanel();
    expect(shared.url).toContain("projectId=second");
    expect(shared.url).not.toContain("workspaceTab=code");
    expect(container.querySelector('[data-testid="real-editor-mount"]')).toBeNull();
    expect(container.textContent).toContain("Second site");
    // Return to A without opening Code in B: do not issue a hidden refetch of A.
    const chooser = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      chooser.value = "first";
      chooser.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await renderPanel();
    expect(shared.url).toContain("projectId=first");
    expect(container.querySelector('[data-testid="real-editor-mount"]')).toBeNull();
    expect(shared.editorMounts).toBe(1);
  });

  it("warns rather than silently discarding unsaved code on project switch", async () => {
    await renderPanel();
    await chooseTab("Code");
    await act(async () => { shared.reportDirty?.("first", true); });
    expect(container.textContent).toContain("You have unsaved code edits.");
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    const dropdown = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      dropdown.value = "second";
      dropdown.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await renderPanel();
    expect(confirm).toHaveBeenCalledOnce();
    expect(shared.url).toContain("projectId=first");
    await chooseTab("History");
    expect(container.querySelector('[data-testid="source-history"]')?.getAttribute("data-unsaved")).toBe("true");
  });

  it("keeps a safe empty state when there is no project", async () => {
    shared.url = "http://localhost/dashboard";
    await renderPanel([]);
    expect(container.querySelector("select")).toBeNull();
    expect(workspaceButton("Code").disabled).toBe(true);
    expect(workspaceButton("History").disabled).toBe(true);
    const newButton = [...container.querySelectorAll("button")].find(
      b => b.textContent?.includes("New project"),
    ) as HTMLButtonElement;
    await act(async () => newButton.click());
    expect(shared.onCreate).toHaveBeenCalledOnce();
  });
});

describe("dashboard simplification contracts", () => {
  it("does not add more routes or duplicate project selectors on the home page", () => {
    const page = p("apps/web/app/(workspace)/dashboard/page.tsx");
    const layout = p("apps/web/app/(workspace)/dashboard/layout.tsx");
    const panel = p("apps/web/components/dashboard/WonderSpaceDashboardPanel.tsx");
    expect(page).toContain("<WonderSpaceDashboardPanel");
    expect(page).toContain("{showOverview && (");
    expect(page).toContain("workspaceTab=code");
    expect(page).not.toContain("setProjectOpen");
    expect(page).not.toContain("Recent Projects");
    expect(panel).toContain("hidden={activeTab !== \"code\"}");
    expect(layout).toContain('label: "Build"');
    expect(layout).toContain('label: "Code"');
    expect(layout).toContain('label: "3D"');
    expect(layout).toContain("const menuGroups: SiteMenuGroup[] = [");
    expect(layout).toContain('label: "3D AI Generator"');
    expect(layout).toContain('aria-label="DreamMakerHub site navigation"');
  });
});
