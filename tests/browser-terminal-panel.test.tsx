// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import BrowserTerminalPanel from "../apps/web/components/dashboard/BrowserTerminalPanel";

let container: HTMLDivElement;
let root: Root;

function button(label: string): HTMLButtonElement {
  const match = [...container.querySelectorAll("button")]
    .find(item => item.getAttribute("aria-label") === label || item.textContent?.trim() === label);
  if (!match) throw new Error(`Missing button: ${label}`);
  return match as HTMLButtonElement;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("browser terminal panel", () => {
  it("is an honest UI-only terminal shell and can be hidden", async () => {
    await act(async () => {
      root.render(<BrowserTerminalPanel projectId="project-1" />);
    });
    expect(container.textContent).toContain("Browser runtime is not connected yet.");
    expect(container.textContent).toContain("project project-1");
    expect(container.querySelector("input")).toBeNull();

    await act(async () => button("Hide terminal panel").click());
    expect(container.textContent).not.toContain("Browser runtime is not connected yet.");
    expect(window.localStorage.getItem("dmh.browser-terminal.open")).toBe("false");
  });

  it("reopens from the bottom tabs and persists the selected view", async () => {
    window.localStorage.setItem("dmh.browser-terminal.open", "false");
    await act(async () => {
      root.render(<BrowserTerminalPanel projectId="project-2" />);
    });
    await act(async () => button("Output").click());
    expect(container.textContent).toContain("Build and preview output will appear here");
    expect(window.localStorage.getItem("dmh.browser-terminal.open")).toBe("true");
    expect(window.localStorage.getItem("dmh.browser-terminal.tab")).toBe("output");
  });

  it("exposes a drag handle for resizing the open panel", async () => {
    await act(async () => {
      root.render(<BrowserTerminalPanel />);
    });
    const handle = button("Resize terminal panel");
    expect(handle.getAttribute("title")).toContain("Drag to resize");
  });
});
