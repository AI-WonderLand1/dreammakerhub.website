import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { githubRepositoryLink, parseGithubRepository } from
  "../apps/web/lib/wonderspace/github-repository";

const mocks = vi.hoisted(() => ({
  requirePaidAIUser: vi.fn(),
  getProjectMetadata: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock("@/app/api/ai/auth", () => ({ requirePaidAIUser: mocks.requirePaidAIUser }));
vi.mock("@/lib/projects/storage", () => ({
  getProjectMetadata: mocks.getProjectMetadata,
  readFile: mocks.readFile,
  writeFile: mocks.writeFile,
  deleteFile: mocks.deleteFile,
}));
import { DELETE, GET, PUT } from "../apps/web/app/api/projects/[projectId]/github-connection/route";

const ownerId = "00000000-0000-4000-8000-000000000001";
const projectId = "project-1";
const params = { params: Promise.resolve({ projectId }) };
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  mocks.requirePaidAIUser.mockResolvedValue({ userId: ownerId });
  mocks.getProjectMetadata.mockResolvedValue({ id: projectId, ownerId });
});
afterEach(() => vi.unstubAllGlobals());

describe("GitHub repository URL security", () => {
  it("normalizes an explicit GitHub repository and generates only GitHub URLs", () => {
    expect(parseGithubRepository("https://github.com/AI-WonderLand1/dreammakerhub.website.git"))
      .toBe("AI-WonderLand1/dreammakerhub.website");
    expect(parseGithubRepository("owner/repo")).toBe("owner/repo");
    expect(githubRepositoryLink("owner/repo", "pulls")).toBe("https://github.com/owner/repo/pulls");
  });

  it.each([
    "https://evil.example/owner/repo",
    "https://github.com/owner/repo/issues",
    "https://github.com/owner/repo?token=secret",
    "owner/repo/../../other",
    "owner/repo%2fother",
    "https://github.com@evil.example/owner/repo",
    "owner/.git/other",
    "",
  ])("rejects unsafe and non-repository input: %s", value => {
    expect(parseGithubRepository(value)).toBeNull();
  });
});

describe("owner-scoped GitHub repo shortcut API", () => {
  it("does not expose another user's GitHub link or write a project file", async () => {
    mocks.getProjectMetadata.mockRejectedValue(new Error("Forbidden"));
    const req = new NextRequest("http://localhost/api/projects/project-1/github-connection");
    const result = await GET(req, params);
    expect(result.status).toBe(404);
    expect(mocks.readFile).not.toHaveBeenCalled();
    const update = await PUT(new NextRequest(req.url, {
      method: "PUT", body: JSON.stringify({ repository: "owner/repo" }),
    }), params);
    expect(update.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it("returns 401 for missing Supabase authentication", async () => {
    mocks.requirePaidAIUser.mockResolvedValue(NextResponse.json({ error: "Login required" }, { status: 401 }));
    const response = await GET(new NextRequest("http://localhost/api/projects/project-1/github-connection"), params);
    expect(response.status).toBe(401);
    expect(mocks.getProjectMetadata).not.toHaveBeenCalled();
  });

  it("stores only the GitHub-verified name for a public repository, never credentials", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ full_name: "owner/repo", private: false }));
    const req = new NextRequest("http://localhost/api/projects/project-1/github-connection", {
      method: "PUT",
      body: JSON.stringify({ repository: "https://github.com/owner/repo" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(200);
    expect(mocks.writeFile).toHaveBeenCalledOnce();
    expect(mocks.writeFile.mock.calls[0].slice(0, 3))
      .toEqual([projectId, ownerId, ".wonderspace/github-repository.json"]);
    expect(JSON.parse(mocks.writeFile.mock.calls[0][3])).toEqual({
      repository: "owner/repo",
      verifiedAt: expect.any(String),
    });
    expect((await res.json()).syncEnabled).toBe(false);
    expect(JSON.stringify(mocks.writeFile.mock.calls)).not.toContain("github-oauth-token");
  });

  it("can verify an authorized private repo without persisting its GitHub token", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ full_name: "owner/private-repo", private: true }));
    const req = new NextRequest("http://localhost/api/projects/project-1/github-connection", {
      method: "PUT",
      headers: { "x-github-oauth-token": "short-lived-github-token" },
      body: JSON.stringify({ repository: "owner/private-repo" }),
    });
    expect((await PUT(req, params)).status).toBe(200);
    expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toEqual(expect.objectContaining({
      Authorization: "Bearer short-lived-github-token",
    }));
    expect(JSON.stringify(mocks.writeFile.mock.calls)).not.toContain("short-lived-github-token");
  });

  it("does not save nonexistent repositories or provide automatic GitHub sync", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 404 }));
    const req = new NextRequest("http://localhost/api/projects/project-1/github-connection", {
      method: "PUT", body: JSON.stringify({ repository: "owner/unavailable" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(422);
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it("does not trust a forged editable repo record as verified without a live GitHub check", async () => {
    mocks.readFile.mockResolvedValue(JSON.stringify({
      repository: "forged/private-repository", verifiedAt: "2099-01-01T00:00:00Z",
    }));
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 404 }));
    const res = await GET(new NextRequest("http://localhost/api/projects/project-1/github-connection"), params);
    expect(res.status).toBe(503);
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it("reads and unlinks the project-specific shortcut without deleting project files", async () => {
    mocks.readFile.mockResolvedValue(JSON.stringify({ repository: "owner/repo" }));
    vi.mocked(fetch).mockResolvedValue(Response.json({ full_name: "owner/repo", private: false }));
    const req = new NextRequest("http://localhost/api/projects/project-1/github-connection");
    expect((await (await GET(req, params)).json()).repository.fullName).toBe("owner/repo");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo", expect.objectContaining({ headers: { Accept: "application/vnd.github+json" } }),
    );
    expect(mocks.readFile).toHaveBeenCalledWith(projectId, ownerId, ".wonderspace/github-repository.json");
    const res = await DELETE(new NextRequest(req.url, { method: "DELETE" }), params);
    expect(res.status).toBe(200);
    expect(mocks.deleteFile).toHaveBeenCalledWith(projectId, ownerId, ".wonderspace/github-repository.json");
  });
});

describe("one dashboard/project/browser navigation", () => {
  it("keeps the same authenticated project ID and opens the REAL local file editor", () => {
    const dashboard = read("apps/web/app/(workspace)/dashboard/page.tsx");
    const panel = read("apps/web/components/dashboard/WonderSpaceDashboardPanel.tsx");
    const nav = read("apps/web/components/dashboard/WonderSpaceProjectNavigation.tsx");
    const overview = read("apps/web/app/(workspace)/dashboard/projects/[id]/page.tsx");
    const manager = read("apps/web/app/(workspace)/dashboard/projects/[id]/files/page.tsx");
    const layout = read("apps/web/app/(workspace)/dashboard/layout.tsx");
    const browser = read("apps/web/app/wonderspace/browser/page.tsx");
    expect(dashboard).toContain("<WonderSpaceDashboardPanel");
    expect(panel).toContain("projects.map(project =>");
    expect(panel).toContain('params.set("projectId", projectId)');
    expect(panel).toContain('params.set("projectId", selected.id)');
    expect(nav).toContain('href: id ? `/dashboard?projectId=${id}#projects`');
    expect(panel).toContain("<WonderSpaceProjectNavigation projectId={selected?.id}");
    expect(nav).toContain("dashboard/projects/");
    expect(overview).toContain("<WonderSpaceProjectNavigation projectId={project.id}");
    expect(manager).toContain('<WonderSpaceProjectNavigation projectId={project.id} active="code" />');
    expect(manager).toContain("<RepositoryFileBrowser");
    expect(layout).toContain("<WonderSpaceProjectNavigation projectId={currentProject.id}");
    expect(browser).toContain("<WonderSpaceProjectNavigation />");
  });

  it("does not fabricate GitHub issues, PRs, repository access, or IDE pods", () => {
    const nav = read("apps/web/components/dashboard/WonderSpaceProjectNavigation.tsx");
    const api = read("apps/web/app/api/projects/[projectId]/github-connection/route.ts");
    expect(nav).toContain("aria-disabled");
    expect(nav).toContain('href: github("issues")');
    expect(nav).toContain('href: github("pulls")');
    expect(nav).toContain("no automatic push or pull");
    expect(api).toContain("await getProjectMetadata(projectId, auth.userId)");
    expect(api).toContain("syncEnabled: false");
    expect(api).not.toContain("service_role");
    expect(nav).not.toContain("CODER_API_TOKEN");
  });
});
