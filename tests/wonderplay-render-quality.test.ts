import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fitOrbitDistance, orbitClipPlanes } from "../apps/web/lib/scene/camera-framing";

describe("WonderPlay graphics without changing project delivery", () => {
  it("fits entire GLB bounding spheres in narrow and wide viewports", () => {
    const wide = fitOrbitDistance(100, 60, 16 / 9);
    const narrow = fitOrbitDistance(100, 60, 1 / 2);
    expect(narrow).toBeGreaterThan(wide);
    expect(wide).toBeGreaterThan(100);
    expect(fitOrbitDistance(0, 60, 1)).toBeGreaterThan(0);
  });

  it("maintains useful depth precision for tiny assets and whole cities", () => {
    const prop = orbitClipPlanes(5, 1);
    const city = orbitClipPlanes(2000, 700);
    expect(prop.far).toBeLessThan(1000);
    expect(prop.near).toBeGreaterThan(0);
    expect(city.far).toBeGreaterThan(city.near);
    expect(city.far).toBeGreaterThan(4000);
  });

  it("uses real camera tone mapping, imported PBR materials and selectable quality", () => {
    const viewport = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioViewport.tsx"), "utf8");
    const editor = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioGameFoundation.tsx"), "utf8");
    expect(viewport).toContain("cameraRef.current.camera.toneMapping = value");
    expect(viewport).not.toContain("app.scene.toneMapping = value");
    expect(viewport).toContain("new pc.CameraFrame(app, camera)");
    expect(viewport).toContain("texture.anisotropy");
    expect(viewport).toContain("instantiateRenderEntity");
    expect(editor).toContain('aria-label="Rendering quality"');
    expect(editor).toContain("setRenderQuality(renderQuality)");
  });

  it("prefilters a browser-local environment probe without changing customer GLBs or publishing", () => {
    const viewport = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioViewport.tsx"), "utf8");
    const editor = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioGameFoundation.tsx"), "utf8");
    expect(viewport).toContain("pc.EnvLighting.generateLightingSource(source");
    expect(viewport).toContain("pc.EnvLighting.generateAtlas(lightingSource");
    expect(viewport).toContain("app.scene.envAtlas = atlas");
    expect(viewport).toContain('quality === "performance"');
    expect(viewport).toContain("environmentCacheRef.current.clear()");
    expect(editor).toContain('aria-label="Environment lighting"');
    expect(editor).toContain("setEnvironmentLighting(environmentLighting)");
    expect(editor).toContain("rendering: { quality: renderQuality, environmentLighting,");
  });

  it("injects GLB render entities rather than treating containers as legacy models", () => {
    const viewport = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioViewport.tsx"), "utf8");
    expect(viewport).toContain("asset.resource.instantiateRenderEntity({ castShadows: shadowsRef.current })");
    expect(viewport).not.toContain("asset.resource.model");
  });

  it("renders SOG/PLY assets with the native PlayCanvas Gaussian component", () => {
    const viewport = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioViewport.tsx"), "utf8");
    const editor = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioGameFoundation.tsx"), "utf8");
    expect(viewport).toContain('new pc.Asset(obj.name || "Gaussian splat", "gsplat"');
    expect(viewport).toContain('entity.addComponent("gsplat", { asset })');
    expect(viewport).toContain('if (!obj.splatUrl)');
    expect(viewport).toContain("sceneSplatAssetsRef.current = []");
    expect(editor).toContain('accept=".sog,.ply"');
    expect(editor).toContain('generatedAsset');
    expect(editor).toContain('splatUrl: ""');
  });

  it("bridges real AI GLBs into PlayCanvas without changing publishing", () => {
    const generator = readFileSync(join(process.cwd(), "apps/web/lib/wonder3d/components/SandboxStudio.tsx"), "utf8");
    const preview = readFileSync(join(process.cwd(), "apps/web/components/studio/PlayCanvasAssetPreview.tsx"), "utf8");
    expect(generator).toContain("<PlayCanvasAssetPreview url={activeAsset.glbUrl}");
    expect(generator).toContain("&generatedAsset=");
    expect(preview).toContain("<StudioViewport");
    expect(preview).toContain('frameOnLoad: true');
    expect(generator).not.toContain("pbrReady: true");
    expect(generator).not.toContain("uvUnwrapped: true");
  });

  it("checks the text-to-3D endpoint before charging rendering credits", () => {
    const api = readFileSync(join(process.cwd(), "apps/web/app/api/v1/3d/generate/route.ts"), "utf8");
    const preflight = api.indexOf("await assertHunyuanTextEndpointReady()");
    const creditReserve = api.indexOf("await reserveBillableUnits(");
    expect(preflight).toBeGreaterThan(0);
    expect(creditReserve).toBeGreaterThan(preflight);
  });
});
