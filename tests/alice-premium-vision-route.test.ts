import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: { json: (value: unknown, init?: ResponseInit) => Response.json(value, init) },
}));
vi.mock("@/lib/auth", () => ({ requireUserId: vi.fn() }));
vi.mock("@/lib/billing/cost-guard.server", () => ({
  reserveAiRequest: vi.fn(),
  costGateResponse: () => Response.json({ code: "COST_GUARD" }, { status: 402 }),
}));

// Tiny valid PNG, used for protocol validation only (no actual inference).
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL+9AAAAABJRU5ErkJggg==";
function request(dataUrl = `data:image/png;base64,${PNG}`): Request {
  return new Request("https://dreammakerhub.website/api/ai/alice/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl: dataUrl, instruction: "Recreate this landing page" }),
  });
}
async function setup() {
  const { requireUserId } = await import("@/lib/auth");
  const { reserveAiRequest } = await import("@/lib/billing/cost-guard.server");
  const { POST } = await import("../apps/web/app/api/ai/alice/vision/route");
  vi.mocked(requireUserId).mockResolvedValue("test-user");
  vi.mocked(reserveAiRequest).mockResolvedValue({ plan: "trial" } as any);
  return { POST, requireUserId: vi.mocked(requireUserId), reserveAiRequest: vi.mocked(reserveAiRequest) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GEMINI_API_KEY", "fake-test-key");
  vi.stubEnv("GOOGLE_AI_API_KEY", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Alice premium screenshot analysis", () => {
  it("requires login without charging or contacting providers", async () => {
    const { POST, requireUserId, reserveAiRequest } = await setup();
    requireUserId.mockResolvedValue(null);
    const remote = vi.fn();
    vi.stubGlobal("fetch", remote);
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(remote).not.toHaveBeenCalled();
  });

  it("rejects invalid or unsupported image bytes before any reservation", async () => {
    const { POST, reserveAiRequest } = await setup();
    const remote = vi.fn();
    vi.stubGlobal("fetch", remote);
    const res = await POST(request("data:image/png;base64,aGVsbG8="));
    expect(res.status).toBe(400);
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(remote).not.toHaveBeenCalled();
  });

  it("does not charge when no vision provider key is configured", async () => {
    const { POST, reserveAiRequest } = await setup();
    vi.stubEnv("GEMINI_API_KEY", "");
    const remote = vi.fn();
    vi.stubGlobal("fetch", remote);
    const res = await POST(request());
    expect(res.status).toBe(503);
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(remote).not.toHaveBeenCalled();
  });

  it("stops before provider calls when trial or paid credit verification fails", async () => {
    const { POST, reserveAiRequest } = await setup();
    reserveAiRequest.mockRejectedValue(new Error("trial expired"));
    const remote = vi.fn();
    vi.stubGlobal("fetch", remote);
    const res = await POST(request());
    expect(res.status).toBe(402);
    expect(remote).not.toHaveBeenCalled();
  });

  it("reserves premium credits before returning a design description", async () => {
    const { POST, reserveAiRequest } = await setup();
    const remote = vi.fn().mockResolvedValue(Response.json({
      candidates: [{ content: { parts: [{ text: "A dark hero section with a purple CTA" }] } }],
    }));
    vi.stubGlobal("fetch", remote);
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      description: "A dark hero section with a purple CTA",
      mode: "visual-analysis",
      applied: false,
    });
    expect(reserveAiRequest).toHaveBeenCalledWith("test-user", expect.any(Number), 2048, "premium");
    expect(reserveAiRequest.mock.invocationCallOrder[0]).toBeLessThan(remote.mock.invocationCallOrder[0]);
    const [endpoint, options] = remote.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toContain("gemini-2.5-flash");
    expect((options.headers as Record<string, string>)["x-goog-api-key"]).toBe("fake-test-key");
    const body = JSON.parse(options.body as string);
    expect(body.contents[0].parts[1].inline_data.mime_type).toBe("image/png");
  });
});
