import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderPlay generated 3D asset reuse", () => {
  it("requires a user and project scope before listing private GLBs", () => {
    const route = read("apps/web/app/api/v1/3d/assets/route.ts");
    const store = read("apps/web/lib/3d/generated-asset-store.ts");
    expect(route).toContain("requirePaidAIUser");
    expect(route).toContain('status: 400');
    expect(store).toContain("const prefix = `${userId}/${projectId}`");
    expect(store).toContain(".createSignedUrl(path, 60 * 60)");
    expect(route).toContain("private, no-store");
  });

  it("attaches generated GLBs to the current project", () => {
    const generator = read("apps/web/lib/wonder3d/components/SandboxStudio.tsx");
    expect(generator).toContain("...(projectId ? { projectId } : {})");
  });

  it("persists stable asset IDs, not short-lived signed URLs", () => {
    const world = read("apps/web/components/studio/StudioGameFoundation.tsx");
    expect(world).toContain("assetId?: string");
    expect(world).toContain("modelUrls.get(actor.assetId)");
    expect(world).toContain('objects: scene.objects.map((object) => ({ ...object, meshUrl: "" }))');
    expect(world).toContain("openSavedLevel");
  });
});
