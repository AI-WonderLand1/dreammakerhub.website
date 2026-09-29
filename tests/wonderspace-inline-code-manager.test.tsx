// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

const mocks = vi.hoisted(() => ({
  fetchAuthenticatedProject: vi.fn(),
  browserCallbacks: new Map<string, (files: Record<string, string>) => void>(),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({ href, children }: { href: string; children: ReactNode }) =>
      React.createElement("a", { href }, children),
  };
});
vi.mock("@/lib/wonderspace/browser-project-fetch", () => ({
  fetchAuthenticatedProject: mocks.fetchAuthenticatedProject,
}));
vi.mock("../apps/web/app/(workspace)/dashboard/projects/[id]/RepositoryFileBrowser", async () => {
  const React = await import("react");
  return {
    default: ({ projectId, files, onFilesChange }: {
      projectId: string;
      files: Record<string, string>;
      onFilesChange: (files: Record<string, string>) => void;
    }) => {
      mocks.browserCallbacks.set(projectId, onFilesChange);
      return React.createElement(
        "div",
        { "data-testid": "native-file-browser", "data-project-id": projectId },
        Object.keys(files).join(", "),
      );
    },
  };
});
import WonderSpaceInlineCodeManager from "../apps/web/components/dashboard/WonderSpaceInlineCodeManager";

const first = { id: "first-project", name: "First", tool: "workspace" };
const second = { id: "second-project", name: "Second", tool: "workspace" };
let container: HTMLDivElement;
let root: Root;

const successfulResponse = (files: Record<string, string>) => ({
  ok: true, status: 200, json: async () => ({ files }),
});

function button(name: string): HTMLButtonElement {
  const result = [...container.querySelectorAll("button")]
    .find(element => element.textContent?.includes(name));
  if (!result) throw new Error(`Missing button: ${name}`);
  return result;
}

function browser(): HTMLElement | null {
  return container.querySelector('[data-testid="native-file-browser"]');
}

async function show(project: typeof first | null) {
  await act(async () => {
    root.render(<WonderSpaceInlineCodeManager project={project} />);
  });
}

async function click(name: string) {
  await act(async () => {
    button(name).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.browserCallbacks.clear();
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

describe("native dashboard code manager", () => {
  it("does not fetch every customer's project files until the editor is opened", async () => {
    await show(first);
    expect(container.textContent).toContain("Native code manager");
    expect(button("Open code here")).toBeTruthy();
    expect(mocks.fetchAuthenticatedProject).not.toHaveBeenCalled();
  });

  it("uses the same authenticated project API and full-page editor route", async () => {
    mocks.fetchAuthenticatedProject.mockResolvedValue(
      successfulResponse({ "src/index.ts": "export {}" }),
    );
    await show(first);
    expect(container.querySelector("a")?.getAttribute("href"))
      .toBe("/dashboard/projects/first-project/files");
    await click("Open code here");
    expect(browser()?.getAttribute("data-project-id")).toBe(first.id);
    expect(browser()?.textContent).toContain("src/index.ts");
    expect(mocks.fetchAuthenticatedProject)
      .toHaveBeenCalledWith("/api/projects/first-project/files");
  });

  it("isolates each project so late callbacks cannot overwrite a new selection", async () => {
    mocks.fetchAuthenticatedProject
      .mockResolvedValueOnce(successfulResponse({ "first.txt": "one" }))
      .mockResolvedValueOnce(successfulResponse({ "second.txt": "two" }));
    await show(first);
    await click("Open code here");
    expect(browser()?.textContent).toContain("first.txt");
    const staleCallback = mocks.browserCallbacks.get(first.id);
    expect(staleCallback).toBeTypeOf("function");

    await show(second);
    expect(browser()?.getAttribute("data-project-id")).toBe(second.id);
    expect(browser()?.textContent).toContain("second.txt");
    expect(browser()?.textContent).not.toContain("first.txt");

    await act(async () => { staleCallback?.({ "late-first-project.ts": "private A data" }); });
    expect(browser()?.textContent).not.toContain("late-first-project.ts");
    expect(browser()?.getAttribute("data-project-id")).toBe(second.id);
  });

  it("shows an actionable error and safely retries failures", async () => {
    mocks.fetchAuthenticatedProject
      .mockResolvedValueOnce({
        ok: false, status: 401, json: async () => ({ error: "Session expired" }),
      })
      .mockResolvedValueOnce(successfulResponse({}));
    await show(first);
    await click("Open code here");
    expect(container.textContent).toContain("Sign in again to edit your project.");
    await click("Retry");
    expect(browser()?.getAttribute("data-project-id")).toBe(first.id);
    expect(mocks.fetchAuthenticatedProject).toHaveBeenCalledTimes(2);
  });

  it("does not expose a file manager before a project is selected", async () => {
    await show(null);
    expect(button("Open code here").disabled).toBe(true);
    expect(mocks.fetchAuthenticatedProject).not.toHaveBeenCalled();
  });
});
