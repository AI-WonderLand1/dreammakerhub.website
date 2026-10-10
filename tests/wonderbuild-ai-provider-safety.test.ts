import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) },
}));
vi.mock("@/lib/auth", () => ({ requireUserId: vi.fn() }));
vi.mock("../apps/web/core/ai/runModel", () => ({ runModel: vi.fn() }));
vi.mock("@/lib/usage/log", () => ({ logUsage: vi.fn() }));
vi.mock("@/lib/supabase-service", () => ({ getClient: vi.fn() }));
vi.mock("@/lib/billing/cost-guard.server", () => {
  class CostGateError extends Error {}
  return {
    CostGateError,
    costGateResponse: (error: unknown) => Response.json({
      error: error instanceof Error ? error.message : "Usage unavailable",
      code: "COST_GUARD",
    }, { status: 503 }),
    reserveAiRequest: vi.fn(),
  };
});

const providerKeys = [
  "OPENROUTER_API_KEY", "GROQ_API_KEY",
  "GEMINI_API_KEY", "GOOGLE_AI_API_KEY", "CEREBRAS_API_KEY",
];

async function setup() {
  vi.resetModules();
  vi.clearAllMocks();
  for (const name of providerKeys) vi.stubEnv(name, "");
  vi.stubEnv("FREE_BUILDER_AI_ENABLED", "");
  vi.stubEnv("BILLABLE_OPERATIONS_ENABLED", "");
  const { requireUserId } = await import("@/lib/auth");
  const { runModel } = await import("../apps/web/core/ai/runModel");
  const { reserveAiRequest } = await import("@/lib/billing/cost-guard.server");
  const { logUsage } = await import("@/lib/usage/log");
  const { getClient } = await import("@/lib/supabase-service");
  vi.mocked(requireUserId).mockResolvedValue("test-user");
  vi.mocked(reserveAiRequest).mockResolvedValue({ plan: "free", estimatedTokens: 1400 } as any);
  const { POST } = await import("../apps/web/app/api/ai/route");
  return {
    POST,
    requireUserId: vi.mocked(requireUserId),
    runModel: vi.mocked(runModel),
    reserveAiRequest: vi.mocked(reserveAiRequest),
    logUsage: vi.mocked(logUsage),
    getClient: vi.mocked(getClient),
  };
}

function request(message = "Build a landing page") {
  return new Request("https://dreammakerhub.website/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("WonderBuild AI provider safety", () => {
  it("does not reserve a request when no AI provider is configured", async () => {
    const { POST, reserveAiRequest, runModel } = await setup();
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "AI_NOT_CONFIGURED" });
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });

  it("requires authentication before contacting a provider", async () => {
    const { POST, requireUserId, reserveAiRequest, runModel } = await setup();
    requireUserId.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });

  it("preserves builder JSX syntax and permits only one provider attempt", async () => {
    const { POST, reserveAiRequest, runModel, logUsage } = await setup();
    vi.stubEnv("GROQ_API_KEY", "test-secret");
    runModel.mockResolvedValue({ text: "---BUILDER_ACTION\\n{}\\n---END", tokens: 33 });
    const response = await POST(request("Create a <button>Buy</button> using <MyComponent />"));
    expect(response.status).toBe(200);
    expect(runModel).toHaveBeenCalledWith(expect.objectContaining({
      singleProviderAttempt: true,
      maxTokens: 2048,
      messages: [{ role: "user", content: "Create a <button>Buy</button> using <MyComponent />" }],
    }));
    expect(reserveAiRequest).toHaveBeenCalledWith("test-user", "Create a <button>Buy</button> using <MyComponent />".length, 2048);
    expect(reserveAiRequest.mock.invocationCallOrder[0]).toBeLessThan(runModel.mock.invocationCallOrder[0]);
    expect(logUsage).toHaveBeenCalledOnce();
  });

  it("does not disclose upstream errors or pretend a failed generation succeeded", async () => {
    const { POST, runModel, logUsage } = await setup();
    vi.stubEnv("OPENROUTER_API_KEY", "test-private-secret");
    runModel.mockResolvedValue({ text: "", tokens: 0, error: "test-private-secret upstream failed" });
    const response = await POST(request());
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).not.toContain("test-private-secret");
    expect(text).not.toContain("upstream failed");
    expect(logUsage).not.toHaveBeenCalled();
  });
  it("serves the operator-enabled free builder through a strict no-fallback model and atomic request quota", async () => {
    const { POST, runModel, reserveAiRequest, getClient, logUsage } = await setup();
    vi.stubEnv("FREE_BUILDER_AI_ENABLED", "true");
    vi.stubEnv("OPENROUTER_API_KEY", "test-free-key");
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    getClient.mockReturnValue({ rpc } as any);
    const providerFetch = vi.fn().mockResolvedValue(Response.json({
      choices: [{ message: { content: '---BUILDER_ACTION\n{"action":"add","block":{"type":"hero"}}\n---END' } }],
      usage: { total_tokens: 130 },
    }));
    vi.stubGlobal("fetch", providerFetch);

    const response = await POST(request("Build a real landing page"));
    expect(response.status).toBe(200);
    expect((await response.json()).text).toContain("---BUILDER_ACTION");
    expect(rpc).toHaveBeenCalledWith("reserve_billable_units", {
      p_user_id: "test-user",
      p_feature: "ai_requests",
      p_units: 1,
      p_limit: 20,
    });
    const [url, options] = providerFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(body.model).toBe("meta-llama/llama-3.3-70b-instruct:free");
    expect(body.max_tokens).toBe(2048);
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
    expect(logUsage).toHaveBeenCalledOnce();
  });

  it("fails closed when the free builder's atomic per-user quota is exhausted", async () => {
    const { POST, getClient, runModel } = await setup();
    vi.stubEnv("FREE_BUILDER_AI_ENABLED", "true");
    vi.stubEnv("OPENROUTER_API_KEY", "test-free-key");
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    getClient.mockReturnValue({ rpc } as any);
    const providerFetch = vi.fn();
    vi.stubGlobal("fetch", providerFetch);

    const response = await POST(request());
    expect(response.status).toBe(429);
    expect((await response.json()).code).toBe("COST_GUARD");
    expect(providerFetch).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });

  it("requires OpenRouter explicitly for the free beta and never falls back to other providers", async () => {
    const { POST, getClient, runModel } = await setup();
    vi.stubEnv("FREE_BUILDER_AI_ENABLED", "true");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "test-groq");
    const providerFetch = vi.fn();
    vi.stubGlobal("fetch", providerFetch);
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("AI_NOT_CONFIGURED");
    expect(getClient).not.toHaveBeenCalled();
    expect(providerFetch).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });

  it("fails closed on usage database errors before calling any provider", async () => {
    const { POST, getClient } = await setup();
    vi.stubEnv("FREE_BUILDER_AI_ENABLED", "true");
    vi.stubEnv("OPENROUTER_API_KEY", "test-free-key");
    getClient.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "no RPC" } }) } as any);
    const providerFetch = vi.fn();
    vi.stubGlobal("fetch", providerFetch);
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("COST_GUARD");
    expect(providerFetch).not.toHaveBeenCalled();
  });

});
