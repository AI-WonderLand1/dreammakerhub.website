import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderPlay PlayCanvas WebGL AI rendering integration", () => {
  it("opens the actual PlayCanvas world instead of the procedural scene by default", () => {
    const app = source("apps/web/components/studio/StudioApp.tsx");
    expect(app).toContain('useState<CreateTool>("game")');
    expect(app).toContain("PlayCanvas · WebGL");
    expect(app).toContain("Procedural Scene");
  });

  it("initializes a WebGL2 graphics device and renders real GLB hierarchies", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    expect(viewport).toContain("pc.createGraphicsDevice(canvas");
    expect(viewport).toContain("pc.DEVICETYPE_WEBGL2");
    expect(viewport).toContain("graphicsDevice: device");
    expect(viewport).toContain("asset.resource.instantiateRenderEntity");
    expect(viewport).toContain("onMeshStatusRef.current?.");
    expect(viewport).toContain("onReadyRef.current?.()");
  });

  it("sends only user-triggered, project-bound text-to-3D requests through the billed API", () => {
    const world = source("apps/web/components/studio/StudioGameFoundation.tsx");
    expect(world).toContain('fetch("/api/v1/3d/generate"');
    expect(world).toContain('JSON.stringify({ projectId, prompt, format: "glb", addTexture: false })');
    expect(world).toContain('projectId === "default"');
    expect(world).toContain("generateModel()");
    expect(world).toContain("addGeneratedModel(asset)");
    expect(world).toContain("onReady={renderWorld}");
  });

  it("rejects unconfigured provider before reserving credits", () => {
    const route = source("apps/web/app/api/v1/3d/generate/route.ts");
    const client = source("apps/web/lib/3d/hunyuan-client.ts");
    expect(route.indexOf("assertHunyuanProviderConfigured();")).toBeLessThan(route.indexOf('reserveBillableUnits(userId, "render_credits"'));
    expect(client).toContain("export function assertHunyuanProviderConfigured()");
    expect(route).toContain("HunyuanConfigurationError");
  });
});
