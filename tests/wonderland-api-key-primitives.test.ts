import { describe, expect, it } from "vitest";
import { makeApiToken, verifyToken } from "../apps/web/lib/crypto/token";

describe("Wonderland key primitives", () => {
  it("generates distinct, one-time verifiable high-entropy tokens", async () => {
    const a = await makeApiToken("wl_live");
    const b = await makeApiToken("wl_live");
    expect(a.token).toMatch(/^wl_live_[A-Za-z0-9_-]+$/);
    expect(a.token).not.toBe(b.token);
    expect(a.token_hash).not.toContain(a.token);
    expect(await verifyToken(a.token, a.token_hash)).toBe(true);
    expect(await verifyToken(b.token, a.token_hash)).toBe(false);
  });
});
