import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  cookieClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: mocks.cookieClient,
}));

import {
  updateProjectFileAtomically, writeFiles, renamePath, deletePath,
} from "../apps/web/lib/projects/storage";

const projectId = "00000000-0000-4000-8000-000000000002";
const ownerId = "00000000-0000-4000-8000-000000000001";
const internal = ".wonderspace/work-items/issue/00000000-0000-4000-8000-000000000003.json";

function fakeClient() {
  const state = { content: JSON.stringify({ comments: [] as string[] }), updatedAt: "2026-09-28T20:00:00.000Z" };
  let firstReads = 0;
  let unlock: (() => void) | undefined;
  const gate = new Promise<void>(resolve => { unlock = resolve; });
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "_projects") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: {
              id: projectId, owner_id: ownerId, name: "Owned project", tool: "workspace",
              publish_enabled: false, custom_domain: null, last_publish_id: null,
              created_at: "2026-09-28T00:00:00.000Z",
              updated_at: "2026-09-28T00:00:00.000Z",
            }, error: null }),
          }),
        }),
      };
    }
    if (table !== "_project_files") throw new Error("Unexpected table: " + table);
    return {
      select: () => {
        const chain = {
          eq: () => chain,
          maybeSingle: async () => {
            // Both simultaneous callers read the same initial row, then race
            // their updates; the second must retry against the committed row.
            const snapshot = { content: state.content, updated_at: state.updatedAt };
            firstReads++;
            if (firstReads === 1) await gate;
            if (firstReads === 2) unlock?.();
            return { data: snapshot, error: null };
          },
        };
        return chain;
      },
      update: (changes: { content: string; updated_at: string }) => {
        let expectedTimestamp: string | undefined;
        const chain = {
          eq: (column: string, expected: string) => {
            if (column === "updated_at") expectedTimestamp = expected;
            return chain;
          },
          select: async () => {
            if (state.updatedAt !== expectedTimestamp) return { data: [], error: null };
            state.content = changes.content;
            state.updatedAt = changes.updated_at;
            return { data: [{ file_path: internal }], error: null };
          },
        };
        return chain;
      },
    };
  });
  return { from, state };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.headers.mockResolvedValue(new Headers());
});

describe("first-party project storage concurrency and protected metadata", () => {
  it("preserves both acknowledged comments submitted from concurrent tabs", async () => {
    const db = fakeClient();
    mocks.cookieClient.mockResolvedValue(db);
    const append = (body: string) => (previous: string) => {
      const value = JSON.parse(previous) as { comments: string[] };
      return JSON.stringify({ comments: [...value.comments, body] });
    };
    const [first, second] = await Promise.all([
      updateProjectFileAtomically(projectId, ownerId, internal, append("First")),
      updateProjectFileAtomically(projectId, ownerId, internal, append("Second")),
    ]);
    expect(JSON.parse(db.state.content).comments.sort()).toEqual(["First", "Second"]);
    expect(first).not.toBe(second);
  });

  it("rejects ZIP/bulk import attempts to replace internal wiki files before database writes", async () => {
    const db = fakeClient();
    mocks.cookieClient.mockResolvedValue(db);
    await expect(writeFiles(projectId, ownerId, [
      { path: "src/main.ts", content: "safe" },
      { path: "docs/../.wonderspace/wiki/home.md", content: "overwrite" },
    ])).rejects.toThrow("Invalid project file path");
    expect(db.from.mock.calls.every(([table]) => table === "_projects")).toBe(true);
  });

  it("rejects renaming or deleting the internal metadata directory", async () => {
    const db = fakeClient();
    mocks.cookieClient.mockResolvedValue(db);
    await expect(renamePath(projectId, ownerId, "src", ".wonderspace")).rejects.toThrow("Invalid project file path");
    await expect(deletePath(projectId, ownerId, ".wonderspace")).rejects.toThrow("Invalid project file path");
  });
});
