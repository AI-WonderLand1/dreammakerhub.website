/** GPU budgets for the same PlayCanvas editor on desktop and mobile. */
export const RENDER_QUALITY_PRESETS = {
  performance: {
    maxPixelRatio: 1,
    shadowResolution: 1024,
    cascades: 1,
    localShadowLights: 0,
    textureAnisotropy: 4,
    msaaSamples: 1,
    ssaoSamples: 0,
    ssaoIntensity: 0,
    bloomIntensity: 0,
    taaEnabled: false,
    sharpness: 0,
    cinematicGrade: false,
  },
  high: {
    maxPixelRatio: 1.75,
    shadowResolution: 2048,
    cascades: 3,
    localShadowLights: 2,
    textureAnisotropy: 16,
    msaaSamples: 4,
    ssaoSamples: 12,
    ssaoIntensity: 0.3,
    bloomIntensity: 0.008,
    taaEnabled: false,
    sharpness: 0.15,
    cinematicGrade: false,
  },
  cinematic: {
    maxPixelRatio: 2,
    shadowResolution: 2048,
    cascades: 4,
    localShadowLights: 4,
    textureAnisotropy: 16,
    msaaSamples: 1,
    ssaoSamples: 24,
    ssaoIntensity: 0.35,
    bloomIntensity: 0.018,
    taaEnabled: true,
    sharpness: 0.35,
    cinematicGrade: true,
  },
} as const;

export type RenderQualityPreset = keyof typeof RENDER_QUALITY_PRESETS;

/** Higher quality is opt-in on narrow/mobile viewports to control GPU cost. */
export function preferredAssetPreviewQuality(viewportWidth: number): RenderQualityPreset {
  return viewportWidth >= 900 ? "cinematic" : "high";
}
