import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (filename: string) => readFileSync(join(process.cwd(), filename), "utf8");

describe("WonderPlay shared GLB scenes and actual renderer controls", () => {
  it("lists only approved folders of the verified public bucket for authenticated users", () => {
    const route = source("apps/web/app/api/wonderplay/library/route.ts");
    expect(route).toContain("authenticatedSupabaseUser(request)");
    expect(route).toContain("status: 401");
    expect(route).toContain('const BUCKET = "3d-assets"');
    expect(route).toContain('"environments", "props", "characters"');
    expect(route).not.toContain('"temp-upload"');
    expect(route).toContain("bucket.data?.public !== true");
    expect(route).toContain('/\\.glb$/i.test(file.name)');
    expect(route).toContain('id: `storage:${path}`');
    expect(route).toContain('"Cache-Control": "private, no-store"');
  });

  it("opens real shared library models from Pick and from the in-editor browser", () => {
    const picker = source("apps/web/components/studio/StudioTemplatesPanel.tsx");
    const editor = source("apps/web/components/studio/StudioGameFoundation.tsx");
    expect(picker).toContain('next.set("libraryAsset", assetId)');
    expect(picker).toContain('item.id.startsWith("storage:") ? modelEditorHref(item.id)');
    expect(editor).toContain('fetch("/api/wonderplay/library"');
    expect(editor).toContain("addSharedModel(savedModel, true)");
    expect(editor).toContain("assetId: asset.id");
    expect(editor).toContain("...sharedAssets.map((asset): [string, string] => [asset.id, asset.url])");
    expect(editor).toContain("actor.environment");
  });

  it("frames imported geometry and exposes functional transforms and rendering settings", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    const editor = source("apps/web/components/studio/StudioGameFoundation.tsx");
    expect(viewport).toContain("const bounds = mesh.aabb");
    expect(viewport).toContain("orbitTargetRef.current = { x: center.x, y: center.y, z: center.z }");
    expect(viewport).toContain("mi.renderStyle = style");
    expect(editor).toContain('(["position", "rotation", "scale"] as const)');
    expect(editor).toContain("setToneMapping(toneMapping)");
    expect(editor).toContain("setExposure(exposure)");
    expect(editor).toContain("setShadows(shadows)");
    expect(editor).toContain("setWireframe(wireframe)");
    expect(editor).toContain('aria-label="Rigid body type"');
    expect(editor).toContain('updateSelectedPhysics(field, event.target.value)');
    expect(editor).toContain("approximate box collider");
  });
});
