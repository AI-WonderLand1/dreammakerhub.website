import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const mocks = vi.hoisted(() => ({
  requirePaidAIUser: vi.fn(),
  getProjectMetadata: vi.fn(),
  listFiles: vi.fn(),
  listInternalProjectFilesByPrefix: vi.fn(),
  updateProjectFileAtomically: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/api/ai/auth", () => ({ requirePaidAIUser: mocks.requirePaidAIUser }));
vi.mock("@/lib/projects/storage", () => ({
  getProjectMetadata: mocks.getProjectMetadata,
  listFiles: mocks.listFiles,
  listInternalProjectFilesByPrefix: mocks.listInternalProjectFilesByPrefix,
  updateProjectFileAtomically: mocks.updateProjectFileAtomically,
  readFile: mocks.readFile,
  writeFile: mocks.writeFile,
}));
vi.mock("@/lib/logger", () => ({ logger: { error: mocks.loggerError } }));

import {
  GET as listItems, POST as createItem, PATCH as updateItem,
} from "../apps/web/app/api/projects/[projectId]/work-items/route";
import {
  GET as readWiki, PUT as saveWiki,
} from "../apps/web/app/api/projects/[projectId]/wiki/route";
const owner = "00000000-0000-4000-8000-000000000001";
const projectId = "00000000-0000-4000-8000-000000000002";
const context = { params: Promise.resolve({ projectId }) };
const files = new Map<string, string>();
const api = `http://localhost/api/projects/${projectId}`;
const request = (path: string, method = "GET", body?: unknown) => new NextRequest(
  api + path,
  { method, ...(body === undefined ? {} : {
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }) },
);

beforeEach(() => {
  vi.resetAllMocks();
  files.clear();
  mocks.requirePaidAIUser.mockResolvedValue({ userId: owner });
  mocks.getProjectMetadata.mockResolvedValue({ id: projectId, ownerId: owner });
  mocks.listFiles.mockImplementation(async () => Array.from(files.keys()));
  mocks.listInternalProjectFilesByPrefix.mockImplementation(async (_project: string, _user: string, prefix: string) =>
    Array.from(files.entries()).filter(([path]) => path.startsWith(prefix))
      .map(([path, content]) => ({ path, content })));
  mocks.updateProjectFileAtomically.mockImplementation(async (
    _project: string, _user: string, path: string, mutate: (value: string) => string,
  ) => {
    const existing = files.get(path);
    if (existing === undefined) throw new Error("ITEM_NOT_FOUND");
    const next = mutate(existing);
    files.set(path, next);
    return next;
  });
  mocks.readFile.mockImplementation(async (_project: string, _user: string, path: string) => files.get(path) ?? null);
  mocks.writeFile.mockImplementation(async (_project: string, _user: string, path: string, content: string) => {
    files.set(path, content);
  });
});

describe("WonderSpace native project issues and discussion threads", () => {
  it("creates and reloads issues under the same owned project and preserves comments", async () => {
    const created = await createItem(request("/work-items", "POST", {
      kind: "issue", title: "Editor save problem", body: "Save and reload",
    }), context);
    expect(created.status).toBe(201);
    const item = (await created.json()).item;
    expect(item.kind).toBe("issue");
    expect(mocks.writeFile.mock.calls[0][0]).toBe(projectId);
    expect(mocks.writeFile.mock.calls[0][1]).toBe(owner);
    expect(mocks.writeFile.mock.calls[0][2]).toMatch(/^\.wonderspace\/work-items\/issue\/[a-f0-9-]+\.json$/);

    const listed = await listItems(request("/work-items?kind=issue"), context);
    expect(listed.status).toBe(200);
    expect((await listed.json()).items.map((x: { title: string }) => x.title)).toEqual(["Editor save problem"]);

    const comment = await updateItem(request("/work-items", "PATCH", {
      kind: "issue", id: item.id, comment: "Fixed in local editor",
    }), context);
    expect(comment.status).toBe(200);
    expect((await comment.json()).item.comments[0].body).toBe("Fixed in local editor");

    const closed = await updateItem(request("/work-items", "PATCH", {
      kind: "issue", id: item.id, status: "closed",
    }), context);
    expect((await closed.json()).item.status).toBe("closed");
  });

  it("keeps discussions separate from issues and never calls an external repository", async () => {
    const discussion = await createItem(request("/work-items", "POST", {
      kind: "discussion", title: "Design", body: "Discuss source management",
    }), context);
    expect(discussion.status).toBe(201);
    const issues = await listItems(request("/work-items?kind=issue"), context);
    const discussions = await listItems(request("/work-items?kind=discussion"), context);
    expect((await issues.json()).items).toEqual([]);
    expect((await discussions.json()).items).toHaveLength(1);
    expect(mocks.writeFile.mock.calls.some(c => c[2].includes("github"))).toBe(false);
  });

  it("requires authentication and project ownership before listing or writing", async () => {
    mocks.requirePaidAIUser.mockResolvedValueOnce(NextResponse.json({ error: "Login required" }, { status: 401 }));
    const denied = await createItem(request("/work-items", "POST", {
      kind: "issue", title: "Private", body: "",
    }), context);
    expect(denied.status).toBe(401);
    expect(mocks.writeFile).not.toHaveBeenCalled();

    mocks.listInternalProjectFilesByPrefix.mockRejectedValueOnce(new Error("Forbidden"));
    const foreign = await listItems(request("/work-items?kind=issue"), context);
    expect(foreign.status).toBe(403);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("rejects oversized input and arbitrary file references", async () => {
    const bad = await createItem(request("/work-items", "POST", {
      kind: "issue", title: "x".repeat(141), body: "",
    }), context);
    expect(bad.status).toBe(400);
    const patched = await updateItem(request("/work-items", "PATCH", {
      kind: "issue", id: "../untrusted", status: "closed",
    }), context);
    expect(patched.status).toBe(400);
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
});

describe("WonderSpace first-party wiki", () => {
  it("reads and saves a Markdown wiki under the verified project owner", async () => {
    const first = await readWiki(request("/wiki"), context);
    expect(first.status).toBe(200);
    expect((await first.json()).exists).toBe(false);

    const saved = await saveWiki(request("/wiki", "PUT", { content: "# Welcome" }), context);
    expect(saved.status).toBe(200);
    expect(mocks.writeFile).toHaveBeenCalledWith(projectId, owner, ".wonderspace/wiki/home.md", "# Welcome");
    const next = await readWiki(request("/wiki"), context);
    expect((await next.json()).content).toBe("# Welcome");
  });

  it("does not permit an unauthenticated wiki write", async () => {
    mocks.requirePaidAIUser.mockResolvedValueOnce(NextResponse.json({ error: "Login required" }, { status: 401 }));
    expect((await saveWiki(request("/wiki", "PUT", { content: "# Secret" }), context)).status).toBe(401);
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
});

describe("general code editor cannot overwrite first-party repository metadata", () => {
  it("prevents generic project file saves, reads and deletes of private native metadata", async () => {
    // This remains a source-level contract: the generic file API uses the real
    // storage integration, while issue/wiki routes use owner-scoped APIs above.
    const route = readFileSync(join(process.cwd(), "apps/web/app/api/projects/[projectId]/files/route.ts"), "utf8");
    expect(route).toContain('value === ".wonderspace" || value.startsWith(".wonderspace/")');
    expect(route).toContain("if (reservedNativePath(path)) continue");
    expect(route).toContain("!reservedNativePath(value)");
    const storage = readFileSync(join(process.cwd(), "apps/web/lib/projects/storage.ts"), "utf8");
    expect(storage).toContain("isReservedWonderSpacePath(normalized)");
    expect(storage).toContain("isReservedWonderSpacePath(oldNormalized) || isReservedWonderSpacePath(newNormalized)");
    expect(storage).toContain('.eq("updated_at", previousTimestamp)');
    expect(storage).toContain("listInternalProjectFilesByPrefix");

  });

  it("does not send first-party project tabs to GitHub", () => {
    const nav = readFileSync(join(process.cwd(), "apps/web/components/dashboard/WonderSpaceProjectNavigation.tsx"), "utf8");
    expect(nav).not.toContain("api.github.com");
    expect(nav).not.toContain("githubRepositoryLink");
    expect(nav).toContain("Native branch reviews");
    expect(nav).toContain("Native CI runs are not connected yet");
  });
});
