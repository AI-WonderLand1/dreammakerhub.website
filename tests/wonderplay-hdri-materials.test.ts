import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeHdrEnvironmentUrl } from "../apps/web/lib/scene/hdr-environment";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("WonderPlay advanced HDR and PBR visuals", () => {
  it("accepts public Supabase Storage and same-site HDR resources permitted by CSP", () => {
    expect(normalizeHdrEnvironmentUrl("https://studio-abc.supabase.co/storage/v1/object/public/environments/softbox.hdr")).toBe("https://studio-abc.supabase.co/storage/v1/object/public/environments/softbox.hdr");
    expect(normalizeHdrEnvironmentUrl("/assets/light-rig.HDR")).toBe("/assets/light-rig.HDR");
  });

  it("refuses insecure or credential-bearing environment links", () => {
    for (const candidate of [
      "http://cdn.example.test/sky.hdr", "javascript:alert(1)", "//cdn.example.test/sky.hdr",
      "https://cdn.example.test/sky.hdr",
      "https://user:pass@cdn.example.test/sky.hdr", "https://cdn.example.test/sky.jpg",
      "https://cdn.example.test/sky.hdr?token=secret", "/assets/sky.hdr#other",
    ]) expect(normalizeHdrEnvironmentUrl(candidate)).toBeNull();
  });

  it("prefilters genuine HDR textures instead of replacing imported PBR maps", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    expect(viewport).toContain('"WonderPlay HDR environment", "texture"');
    expect(viewport).toContain("pc.TEXTUREPROJECTION_EQUIRECT");
    expect(viewport).toContain("pc.EnvLighting.generateLightingSource(source");
    expect(viewport).toContain("app.scene.envAtlas = atlas");
    expect(viewport).toContain("describeImportedPbr(imported)");
    expect(viewport).toContain("localShadowLights++");
    expect(viewport).not.toContain("material.emissiveMap = null");
  });

  it("persists the public HDR source with rendering settings, not in customer GLBs", () => {
    const editor = source("apps/web/components/studio/StudioGameFoundation.tsx");
    expect(editor).toContain("setEnvironmentLighting(environmentLighting, hdrEnvironmentUrl)");
    expect(editor).toContain("rendering: { quality: renderQuality, environmentLighting, hdrEnvironmentUrl");
    expect(editor).toContain("Imported PBR texture report");
    expect(editor).toContain("Static lightmaps are not automatically baked");
  });
});
