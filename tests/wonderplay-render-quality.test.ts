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
});
