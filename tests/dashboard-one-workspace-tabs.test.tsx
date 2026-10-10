// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const shared = vi.hoisted(() => ({
  url: "http://localhost/dashboard?projectId=first",
  replace: vi.fn(),
  push: vi.fn(),
  onCreate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: shared.replace, push: shared.push }),
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
vi.mock("../apps/web/components/dashboard/WonderSpaceSourceHistory", async () => {
  const React = await import("react");
  return {
    default: ({ projectId }: { projectId: string }) =>
      React.createElement("div", { "data-testid": "source-history", "data-project-id": projectId }),
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
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

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
  shared.replace.mockImplementation((url: string) => {
    shared.url = new URL(url, "http://localhost").toString();
  });
  shared.push.mockImplementation((url: string) => {
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

describe("single project file editor", () => {
  it("keeps the dashboard project picker and overview but never mounts a duplicate editor", async () => {
    await renderPanel();
    expect(container.querySelectorAll("select")).toHaveLength(1);
    expect([...container.querySelectorAll('nav[aria-label="Project workspace views"] button')]
      .map(x => x.textContent?.trim())).toEqual(["Overview", "Code", "History", "More tools"]);
    expect(container.textContent).toContain("First website");
    expect(container.querySelector('[data-testid="source-history"]')).toBeNull();
    expect(container.querySelector('a[href="/wonder-build/builder?projectId=first"]')).toBeTruthy();

    const source = read("apps/web/components/dashboard/WonderSpaceDashboardPanel.tsx");
    expect(source).not.toContain("WonderSpaceInlineCodeManager");
    expect(source).not.toContain('id="workspace-code"');
  });

  it("opens the canonical full-page editor when Code is clicked", async () => {
    await renderPanel();
    await chooseTab("Code");
    expect(shared.push).toHaveBeenCalledWith("/dashboard/projects/first/files");
    expect(shared.url).toBe("http://localhost/dashboard/projects/first/files");
  });

  it("redirects bookmarked old dashboard Code URLs to the same editor", async () => {
    shared.url = "http://localhost/dashboard?projectId=second&workspaceTab=code";
    await renderPanel();
    expect(shared.replace).toHaveBeenCalledWith("/dashboard/projects/second/files");
  });

  it("keeps History and More tools separate from the file editor", async () => {
    await renderPanel();
    await chooseTab("More tools");
    expect(container.querySelector('[data-testid="advanced-tools"]')).toBeTruthy();
    await chooseTab("History");
    expect(container.querySelector('[data-testid="source-history"]')?.getAttribute("data-project-id")).toBe("first");
    expect(container.querySelector('[data-testid="advanced-tools"]')).toBeNull();
  });

  it("switches projects without confusing the canonical editor destination", async () => {
    await renderPanel();
    const dropdown = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      dropdown.value = "second";
      dropdown.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await renderPanel();
    expect(shared.url).toContain("projectId=second");
    expect(container.textContent).toContain("Second site");
    await chooseTab("Code");
    expect(shared.push).toHaveBeenCalledWith("/dashboard/projects/second/files");
  });

  it("offers project creation instead of opening an editor when no project exists", async () => {
    shared.url = "http://localhost/dashboard";
    await renderPanel([]);
    expect(container.querySelector("select")).toBeNull();
    expect(workspaceButton("Code").disabled).toBe(true);
    expect(workspaceButton("History").disabled).toBe(true);
    const button = [...container.querySelectorAll("button")].find(b => b.textContent?.includes("New project"));
    await act(async () => (button as HTMLButtonElement).click());
    expect(shared.onCreate).toHaveBeenCalledOnce();
  });
});

describe("dashboard simplification contracts", () => {
  it("uses the full-page files route rather than a second code editor", () => {
    const page = read("apps/web/app/(workspace)/dashboard/page.tsx");
    const layout = read("apps/web/app/(workspace)/dashboard/layout.tsx");
    const panel = read("apps/web/components/dashboard/WonderSpaceDashboardPanel.tsx");
    const fullEditor = read("apps/web/app/(workspace)/dashboard/projects/[id]/files/page.tsx");
    expect(page).toContain("<WonderSpaceDashboardPanel");
    expect(page).toContain("{showOverview && (");
    expect(panel).toContain('params.set("projectId", projectId)');
    expect(panel).toContain('params.set("projectId", selected.id)');
    expect(panel).toContain('router.push(`/dashboard/projects/${encodeURIComponent(selected.id)}/files`)');
    expect(panel).not.toContain("<WonderSpaceInlineCodeManager");
    expect(fullEditor).toContain("<RepositoryFileBrowser");
    expect(layout).toContain('label: "Build"');
    expect(layout).toContain('label: "Code"');
    expect(layout).toContain('label: "3D"');
    expect(layout).toContain("const menuGroups: SiteMenuGroup[] = [");
    expect(layout).toContain('label: "3D AI Generator"');
    expect(layout).toContain('aria-label="AI WONDERLAND site navigation"');
  });
});
