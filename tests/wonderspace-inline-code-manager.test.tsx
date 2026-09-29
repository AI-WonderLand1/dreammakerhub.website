// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  fetchAuthenticatedProject: vi.fn(),
  browserCallbacks: new Map<string, (files: Record<string, string>) => void>(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    createElement("a", { href }, children),
}));
vi.mock("@/lib/wonderspace/browser-project-fetch", () => ({
  fetchAuthenticatedProject: mocks.fetchAuthenticatedProject,
}));
vi.mock("../apps/web/app/(workspace)/dashboard/projects/[id]/RepositoryFileBrowser", () => ({
  default: ({ projectId, files, onFilesChange }: { projectId: string; files: Record<string, string>; onFilesChange: (files: Record<string, string>) => void }) => {
    mocks.browserCallbacks.set(projectId, onFilesChange);
    return createElement("div", { "data-testid": "native-file-browser", "data-project-id": projectId },
      Object.keys(files).join(", "));
  },
}));

import WonderSpaceInlineCodeManager from "../apps/web/components/dashboard/WonderSpaceInlineCodeManager";

const first = { id: "first-project", name: "First", tool: "workspace" };
const second = { id: "second-project", name: "Second", tool: "workspace" };

beforeEach(() => { vi.resetAllMocks(); mocks.browserCallbacks.clear(); });
afterEach(() => cleanup());

describe("native dashboard code manager", () => {
  it("does not fetch every customer's project files until the inline editor is opened", () => {
    render(<WonderSpaceInlineCodeManager project={first} />);
    expect(screen.getByText("Native code manager")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open code here" })).toBeTruthy();
    expect(mocks.fetchAuthenticatedProject).not.toHaveBeenCalled();
  });

  it("uses the same authenticated project API and full-page editor route", async () => {
    mocks.fetchAuthenticatedProject.mockResolvedValue(
      Response.json({ files: { "src/index.ts": "export {}" } }),
    );
    render(<WonderSpaceInlineCodeManager project={first} />);
    expect(screen.getByRole("link", { name: /full-page editor/i }).getAttribute("href"))
      .toBe("/dashboard/projects/first-project/files");
    fireEvent.click(screen.getByRole("button", { name: "Open code here" }));
    const browser = await screen.findByTestId("native-file-browser");
    expect(browser.getAttribute("data-project-id")).toBe(first.id);
    expect(browser.textContent).toContain("src/index.ts");
    expect(mocks.fetchAuthenticatedProject)
      .toHaveBeenCalledWith("/api/projects/first-project/files");
  });

  it("reloads only the newly selected project and never shows another project's old files", async () => {
    mocks.fetchAuthenticatedProject
      .mockResolvedValueOnce(Response.json({ files: { "first.txt": "one" } }))
      .mockResolvedValueOnce(Response.json({ files: { "second.txt": "two" } }));
    const view = render(<WonderSpaceInlineCodeManager project={first} />);
    fireEvent.click(screen.getByRole("button", { name: "Open code here" }));
    expect((await screen.findByTestId("native-file-browser")).textContent).toContain("first.txt");
    const staleFirstProjectCallback = mocks.browserCallbacks.get(first.id);
    expect(staleFirstProjectCallback).toBeTypeOf("function");
    view.rerender(<WonderSpaceInlineCodeManager project={second} />);
    await waitFor(() =>
      expect(screen.getByTestId("native-file-browser").getAttribute("data-project-id")).toBe(second.id),
    );
    expect(screen.getByTestId("native-file-browser").textContent).toContain("second.txt");
    expect(screen.getByTestId("native-file-browser").textContent).not.toContain("first.txt");
    // A late mutation of the unmounted project's browser must not bleed into B.
    staleFirstProjectCallback?.({ "late-first-project.ts": "private A data" });
    expect(screen.getByTestId("native-file-browser").textContent).not.toContain("late-first-project.ts");
    expect(screen.getByTestId("native-file-browser").getAttribute("data-project-id")).toBe(second.id);
  });

  it("shows an actionable error and safely retries failures", async () => {
    mocks.fetchAuthenticatedProject
      .mockResolvedValueOnce(Response.json({ error: "Session expired" }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ files: {} }));
    render(<WonderSpaceInlineCodeManager project={first} />);
    fireEvent.click(screen.getByRole("button", { name: "Open code here" }));
    expect(await screen.findByText("Sign in again to edit your project.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByTestId("native-file-browser")).toBeTruthy();
    expect(mocks.fetchAuthenticatedProject).toHaveBeenCalledTimes(2);
  });

  it("does not expose a file manager before a user has selected a project", () => {
    render(<WonderSpaceInlineCodeManager project={null} />);
    expect(screen.getByRole("button", { name: "Open code here" }).hasAttribute("disabled")).toBe(true);
    expect(mocks.fetchAuthenticatedProject).not.toHaveBeenCalled();
  });
});
