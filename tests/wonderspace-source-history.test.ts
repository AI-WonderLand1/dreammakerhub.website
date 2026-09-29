import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

const mocks = vi.hoisted(() => ({
  requirePaidAIUser: vi.fn(),
  listSourceVersions: vi.fn(),
  captureSourceVersion: vi.fn(),
  loadSourceVersion: vi.fn(),
  listFiles: vi.fn(),
  readFile: vi.fn(),
  loggerError: vi.fn(),
}));
vi.mock("@/app/api/ai/auth", () => ({ requirePaidAIUser: mocks.requirePaidAIUser }));
vi.mock("@/lib/projects/storage", () => ({
  listSourceVersions: mocks.listSourceVersions,
  captureSourceVersion: mocks.captureSourceVersion,
  loadSourceVersion: mocks.loadSourceVersion,
  listFiles: mocks.listFiles,
  readFile: mocks.readFile,
  isReservedWonderSpacePath: (path: string) =>
    path === ".wonderspace" || path.startsWith(".wonderspace/"),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: mocks.loggerError } }));

import { GET, POST } from "../apps/web/app/api/projects/[projectId]/source-history/route";

const ownerId = "owner-1";
const projectId = "project-1";
const versionId = "da6c2d1e-bfc5-464c-8f1d-797f1d797f1d";
const params = { params: Promise.resolve({ projectId }) };
const endpoint = `http://localhost/api/projects/${projectId}/source-history`;
const request = (suffix = "", init?: RequestInit) => new NextRequest(endpoint + suffix, init);
const version = {
  id: versionId, title: "Checkpoint", versionNumber: 1,
  createdAt: "2026-09-28T00:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requirePaidAIUser.mockResolvedValue({ userId: ownerId });
  mocks.listSourceVersions.mockResolvedValue([version]);
  mocks.captureSourceVersion.mockResolvedValue({ ...version, fileCount: 2 });
  mocks.loadSourceVersion.mockResolvedValue({
    ...version, files: { "src/main.ts": "before", "old.txt": "old" },
  });
  mocks.listFiles.mockResolvedValue(["src/main.ts", "new.txt", ".wonderspace/wiki/home.md"]);
  mocks.readFile.mockImplementation(async (_project: string, _owner: string, path: string) =>
    ({ "src/main.ts": "after", "new.txt": "new" } as Record<string, string>)[path] ?? null);
});

describe("authenticated owner-only native source history", () => {
  it("denies guests without touching project data", async () => {
    mocks.requirePaidAIUser.mockResolvedValueOnce(NextResponse.json({ error: "Sign in" }, { status: 401 }));
    const response = await GET(request(), params);
    expect(response.status).toBe(401);
    expect(mocks.listSourceVersions).not.toHaveBeenCalled();
  });

  it("lists only version metadata through the verified owner scope", async () => {
    const response = await GET(request(), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect((await response.json()).versions).toEqual([version]);
    expect(mocks.listSourceVersions).toHaveBeenCalledWith(projectId, ownerId);
    expect(mocks.loadSourceVersion).not.toHaveBeenCalled();
  });

  it("captures already-persisted source without accepting arbitrary client snapshots", async () => {
    const response = await POST(request("", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Before launch", snapshot: { "secret.txt": "forged" } }),
    }), params);
    expect(response.status).toBe(201);
    expect(mocks.captureSourceVersion).toHaveBeenCalledWith(projectId, ownerId, "Before launch");
    expect(mocks.captureSourceVersion.mock.calls[0]).toHaveLength(3);
  });

  it("does not accept invalid titles, unsupported formats or guessed version IDs", async () => {
    const invalid = await POST(request("", {
      method: "POST", body: JSON.stringify({ title: "x".repeat(101) }),
    }), params);
    expect(invalid.status).toBe(400);
    expect(mocks.captureSourceVersion).not.toHaveBeenCalled();
    expect((await GET(request("?versionId=../other&format=zip"), params)).status).toBe(400);
    expect((await GET(request("?format=zip"), params)).status).toBe(400);
    expect((await GET(request("?format=tar"), params)).status).toBe(400);
  });

  it("returns a private path-level comparison excluding native metadata", async () => {
    const response = await GET(request(`?versionId=${versionId}`), params);
    expect(response.status).toBe(200);
    expect((await response.json()).changes).toEqual({
      added: ["new.txt"], modified: ["src/main.ts"], deleted: ["old.txt"],
    });
    expect(mocks.readFile).not.toHaveBeenCalledWith(projectId, ownerId, ".wonderspace/wiki/home.md");
    expect(mocks.loadSourceVersion).toHaveBeenCalledWith(projectId, ownerId, versionId);
  });

  it("exports only a requested owner-validated checkpoint as portable source ZIP", async () => {
    const response = await GET(request(`?versionId=${versionId}&format=zip`), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toContain("src/main.ts");
    expect(Object.keys(zip.files).sort()).toContain("old.txt");
    expect((await zip.file("src/main.ts")?.async("string"))).toBe("before");
    expect(Object.keys(zip.files).some(path => path.startsWith(".wonderspace"))).toBe(false);
    expect(mocks.listFiles).not.toHaveBeenCalled();
  });

  it("handles missing versions, unauthorized projects and quota failures without leaking data", async () => {
    mocks.loadSourceVersion.mockRejectedValueOnce(new Error("SOURCE_VERSION_NOT_FOUND"));
    expect((await GET(request(`?versionId=${versionId}`), params)).status).toBe(404);
    mocks.listSourceVersions.mockRejectedValueOnce(new Error("Forbidden"));
    expect((await GET(request(), params)).status).toBe(404);
    mocks.captureSourceVersion.mockRejectedValueOnce(new Error("SOURCE_CHECKPOINT_TOO_LARGE"));
    expect((await POST(request("", {
      method: "POST", body: JSON.stringify({ title: "Large" }),
    }), params)).status).toBe(413);
    mocks.captureSourceVersion.mockRejectedValueOnce(new Error("SOURCE_HISTORY_LIMIT"));
    expect((await POST(request("", {
      method: "POST", body: JSON.stringify({ title: "Full" }),
    }), params)).status).toBe(409);
  });

  it("documents and gates the native RPC, never a GitHub clone or unattended CI runner", () => {
    const migration = readFileSync(join(
      process.cwd(), "supabase/migrations/202609292301_native_source_versions.sql",
    ), "utf8");
    const nav = readFileSync(join(
      process.cwd(), "apps/web/components/dashboard/WonderSpaceProjectNavigation.tsx",
    ), "utf8");
    const dashboard = readFileSync(join(
      process.cwd(), "apps/web/components/dashboard/WonderSpaceDashboardPanel.tsx",
    ), "utf8");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("owner_id = auth.uid()::text");
    expect(migration).toContain("GRANT SELECT ON public._project_source_versions TO authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.capture_project_source_version");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("SOURCE_CHECKPOINT_TOO_LARGE");
    expect(nav).toContain('label: "History"');
    expect(nav).toContain("showAdvanced");
    expect(dashboard).toContain("<WonderSpaceSourceHistory key={selected.id}");
  });
});
