import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderPlay PlayCanvas WebGL AI rendering integration", () => {
  it("opens Pick first with the PlayCanvas editor in the Edit step", () => {
    const app = source("apps/web/components/studio/StudioApp.tsx");
    expect(app).toContain('? "pick"');
    expect(app).toContain('"game"');
    expect(app).toContain("PlayCanvas Game & World");
    expect(app).toContain("Scene Editor");
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

  it("imports real 3D Studio GLBs into WonderPlay without duplicating billed generation", () => {
    const world = source("apps/web/components/studio/StudioGameFoundation.tsx");
    expect(world).not.toContain("/api/v1/3d/generate");
    expect(world).toContain("fetchAuthenticated3D(`/api/v1/3d/assets?projectId=");
    expect(world).toContain("/dashboard/3dhub?step=pick&pickTool=3d&projectId=");
    expect(world).toContain('label: "Blank Canvas"');
    expect(world).toContain('aria-label={axis + " position"}');
    expect(world).toContain('projectId === "default"');
    expect(world).toContain("addGeneratedModel(asset)");
    expect(world).toContain("onReady={renderWorld}");
  });

  it("preserves cookie auth for text-to-3D and bearer auth for SimpleRick image-to-3D", () => {
    const studio = source("apps/web/lib/wonder3d/components/SandboxStudio.tsx");
    expect(studio).toContain("fetch('/api/v1/3d/generate', {");
    expect(studio).toContain("credentials: 'include'");
    expect(studio).not.toContain("fetchAuthenticated3D('/api/v1/3d/generate'");
    expect(studio).toContain("fetchAuthenticated3D('/api/v1/3d/image'");
  });

  it("rejects unconfigured provider before reserving credits", () => {
    const route = source("apps/web/app/api/v1/3d/generate/route.ts");
    const client = source("apps/web/lib/3d/hunyuan-client.ts");
    expect(route.indexOf("assertHunyuanProviderConfigured();")).toBeLessThan(route.indexOf('reserveBillableUnits(userId, "render_credits"'));
    expect(client).toContain("export function assertHunyuanProviderConfigured()");
    expect(route).toContain("HunyuanConfigurationError");
  });
});
