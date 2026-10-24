import { describe, expect, it } from "vitest";
import { preferredAssetPreviewQuality, RENDER_QUALITY_PRESETS } from "../apps/web/lib/scene/render-quality";

describe("PlayCanvas graphics presets", () => {
  it("reserves cinematic post-processing for the premium preset", () => {
    const { performance, high, cinematic } = RENDER_QUALITY_PRESETS;
    expect(performance.localShadowLights).toBe(0);
    expect(high.msaaSamples).toBe(4);
    expect(high.taaEnabled).toBe(false);
    expect(cinematic.msaaSamples).toBe(1);
    expect(cinematic.taaEnabled).toBe(true);
    expect(cinematic.cinematicGrade).toBe(true);
    expect(cinematic.ssaoSamples).toBeGreaterThan(high.ssaoSamples);
    expect(cinematic.bloomIntensity).toBeGreaterThan(high.bloomIntensity);
    expect(cinematic.maxPixelRatio).toBeGreaterThanOrEqual(high.maxPixelRatio);
  });

  it("avoids forcing cinematic GPU costs on narrow viewports", () => {
    expect(preferredAssetPreviewQuality(390)).toBe("high");
    expect(preferredAssetPreviewQuality(900)).toBe("cinematic");
  });
});
