import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { middleware } from "../apps/web/middleware";

const request = (path: string, apiKey?: string) => new NextRequest(
  `https://dreammakerhub.website${path}`,
  { method: "POST", headers: apiKey ? { "x-api-key": apiKey } : {} },
);

describe("Stripe webhook middleware authentication", () => {
  beforeEach(() => vi.stubEnv("N8N_API_KEY", "internal-n8n-key"));
  afterEach(() => vi.unstubAllEnvs());

  it("allows Stripe's exact signed-webhook route through without the unrelated n8n key", () => {
    const response = middleware(request("/api/webhooks/stripe"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps every other webhook and n8n integration protected by the internal key", async () => {
    for (const path of [
      "/api/webhooks/incoming/project123",
      "/api/webhooks/stripe/other",
      "/api/n8n/jobs",
    ]) {
      const denied = middleware(request(path));
      expect(denied.status).toBe(401);
      expect((await denied.json()).error).toBe("Invalid or missing API key");
      const allowed = middleware(request(path, "internal-n8n-key"));
      expect(allowed.status).toBe(200);
    }
  });

  it("leaves signature verification in the Stripe route handler, not middleware", () => {
    const handler = readFileSync(join(
      process.cwd(), "apps/web/app/api/webhooks/stripe/route.ts",
    ), "utf8");
    expect(handler).toContain('request.headers.get("stripe-signature")');
    expect(handler).toContain("stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)");
    expect(handler).toContain("if (!STRIPE_WEBHOOK_SECRET || !signature)");
  });
});
