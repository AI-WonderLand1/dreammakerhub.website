import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) },
}));
vi.mock("@/lib/auth", () => ({ requireUserId: vi.fn() }));
vi.mock("@/lib/projects/storage", () => ({
  getProjectMetadata: vi.fn(),
  listFiles: vi.fn(),
  readFile: vi.fn(),
}));
vi.mock("@/lib/billing/cost-guard.server", () => ({
  reserveAiRequest: vi.fn(),
  costGateResponse: () => Response.json({ code: "COST_GUARD" }, { status: 402 }),
}));
vi.mock("../apps/web/core/ai/runModel", () => ({ runModel: vi.fn() }));
vi.mock("@/lib/usage/log", () => ({ logUsage: vi.fn() }));

const PROJECT = "11111111-2222-3333-4444-555555555555";
const req = (projectId: string = PROJECT, prompt = "Build a beautiful full-stack dashboard") =>
  new Request("https://dreammakerhub.website/api/ai/alice/fullstack", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, prompt, mode: "fullstack" }),
  }) as any;

async function setup() {
  const { requireUserId } = await import("@/lib/auth");
  const { getProjectMetadata, listFiles, readFile } = await import("@/lib/projects/storage");
  const { reserveAiRequest } = await import("@/lib/billing/cost-guard.server");
  const { runModel } = await import("../apps/web/core/ai/runModel");
  const { POST } = await import("../apps/web/app/api/ai/alice/fullstack/route");
  vi.mocked(requireUserId).mockResolvedValue("trusted-user");
  vi.mocked(getProjectMetadata).mockResolvedValue({ id: PROJECT } as any);
  vi.mocked(listFiles).mockResolvedValue([]);
  vi.mocked(readFile).mockResolvedValue(null);
  vi.mocked(reserveAiRequest).mockResolvedValue({ plan: "trial" } as any);
  return { POST, requireUserId: vi.mocked(requireUserId), getProjectMetadata: vi.mocked(getProjectMetadata),
    reserveAiRequest: vi.mocked(reserveAiRequest), runModel: vi.mocked(runModel) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("OPENROUTER_API_KEY", "test-key-not-real");
  vi.stubEnv("ALICE_FULLSTACK_MODEL", "sample-code-model");
});
afterEach(() => vi.unstubAllEnvs());

describe("Alice full-stack generation", () => {
  it("requires login and never calls a provider for unauthenticated users", async () => {
    const { POST, requireUserId, getProjectMetadata, reserveAiRequest } = await setup();
    requireUserId.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(401);
    expect(getProjectMetadata).not.toHaveBeenCalled();
    expect(reserveAiRequest).not.toHaveBeenCalled();
  });

  it("fails closed for projects not owned by the authenticated user", async () => {
    const { POST, getProjectMetadata, reserveAiRequest, runModel } = await setup();
    getProjectMetadata.mockRejectedValue(new Error("Forbidden"));
    expect((await POST(req())).status).toBe(404);
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });

  it("does not call a provider without configured premium model", async () => {
    const { POST, reserveAiRequest, runModel } = await setup();
    vi.stubEnv("ALICE_FULLSTACK_MODEL", "");
    expect((await POST(req())).status).toBe(503);
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });

  it("reserves credits before any model call", async () => {
    const { POST, reserveAiRequest, runModel } = await setup();
    reserveAiRequest.mockRejectedValue(new Error("Trial exhausted"));
    expect((await POST(req())).status).toBe(402);
    expect(runModel).not.toHaveBeenCalled();
  });

  it("returns proposed frontend and backend files without saving or publishing", async () => {
    const { POST, reserveAiRequest, runModel } = await setup();
    runModel.mockResolvedValue({
      text: JSON.stringify({ summary: "Dashboard", files: [
        { path: "src/App.tsx", content: "export default function App(){return <h1>Hello</h1>}" },
        { path: "api/health.ts", content: "export const GET = () => Response.json({ok:true})" },
      ], notes: ["Add secrets to the server."] }),
      tokens: 86,
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ projectId: PROJECT, saved: false, verifiedBuild: false, published: false });
    expect(body.files).toHaveLength(2);
    expect(reserveAiRequest).toHaveBeenCalledWith("trusted-user", expect.any(Number), 4096, "premium");
    expect(reserveAiRequest.mock.invocationCallOrder[0]).toBeLessThan(runModel.mock.invocationCallOrder[0]);
  });

  it("rejects unsafe paths proposed by models", async () => {
    const { POST, runModel } = await setup();
    runModel.mockResolvedValue({ text: JSON.stringify({
      files: [{ path: ".env", content: "PASSWORD=oops" }],
    }), tokens: 30 });
    expect((await POST(req())).status).toBe(502);
  });

  it("rejects request when the project ID is invalid", async () => {
    const { POST, getProjectMetadata } = await setup();
    expect((await POST(req("../another-project"))).status).toBe(400);
    expect(getProjectMetadata).not.toHaveBeenCalled();
  });
});
