import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createStarterSurfaceMaps } from "../apps/web/lib/scene/procedural-surfaces";

describe("WonderPlay starter graphics without changing 3D delivery", () => {
  it("generates deterministic PBR base and tangent-normal detail for each starter surface", () => {
    for (const surface of ["terrain", "concrete", "coated-metal", "fabric"] as const) {
      const first = createStarterSurfaceMaps(surface, 32);
      const second = createStarterSurfaceMaps(surface, 32);
      expect(first.color).toEqual(second.color);
      expect(first.normal).toEqual(second.normal);
      expect(first.color).toHaveLength(32 * 32 * 4);
      expect(first.normal).toHaveLength(32 * 32 * 4);
      expect(new Set(first.color.filter((_, index) => index % 4 === 0)).size).toBeGreaterThan(4);
      expect(first.normal.every((value, index) => index % 4 !== 3 || value === 255)).toBe(true);
      expect(first.normal.some((value, index) => index % 4 === 0 && value !== 128)).toBe(true);
    }
  });

  it("rejects accidental oversized texture allocations", () => {
    expect(() => createStarterSurfaceMaps("terrain", 4096)).toThrow(RangeError);
  });

  it("attaches repeating PBR maps only to editor primitives and releases cached GPU textures", () => {
    const viewport = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioViewport.tsx"), "utf8");
    const editor = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioGameFoundation.tsx"), "utf8");
    expect(viewport).toContain("if (mat.starterSurface)");
    expect(viewport).toContain("m.diffuseMap = textures.diffuse");
    expect(viewport).toContain("m.normalMap = textures.normal");
    expect(viewport).toContain("starterTexturesRef.current.clear()");
    expect(editor).toContain('starterSurface: "terrain"');
    expect(editor).toContain('surfaceTiling: 8');
    expect(viewport).toContain("instantiateRenderEntity({ castShadows: shadowsRef.current })");
  });

  it("exposes front, right, top and perspective angles without breaking orbit framing", () => {
    const viewport = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioViewport.tsx"), "utf8");
    const editor = readFileSync(join(process.cwd(), "apps/web/components/studio/StudioGameFoundation.tsx"), "utf8");
    expect(viewport).toContain("setCameraView: (view: CameraView) => void");
    expect(viewport).toContain("orbitRef.current = { ...orbitRef.current, ...views[view] }");
    expect(editor).toContain('aria-label="Camera angle"');
    expect(editor).toContain('value="top"');
  });
});
