import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanSceneData } from "../apps/web/lib/scene/auto-save";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("PlayCanvas native editor regression coverage", () => {
  it("keeps primitive objects and removes temporary mesh assets", () => {
    const clean = cleanSceneData({
      objects: [
        { id: "cube", geometry: "box", position: [0, 0, 0] },
        { id: "sphere", geometry: "sphere" },
        { id: "mesh", meshUrl: "/models/robot.glb" },
        { id: "temp", meshUrl: "/models/__temp.glb" },
      ],
    });
    expect((clean.objects as any[]).map((object) => object.id)).toEqual(["cube", "sphere", "mesh"]);
  });

  it("mounts the actual PlayCanvas engine instead of rebranding a WebGL Studio iframe", () => {
    const wrapper = read("apps/web/components/PlayCanvasEditorHost.tsx");
    const engine = read("apps/web/components/NativePlayCanvasHost.tsx");
    expect(wrapper).toContain("NativePlayCanvasHost");
    expect(wrapper).not.toContain("DirectPlayCanvasHost");
    expect(engine).toContain('await import("playcanvas")');
    expect(engine).toContain("new pc.Application(canvas)");
    expect(engine).not.toContain("iframe");
  });

  it("requires authenticated persisted saves before showing success", () => {
    const route = read("apps/web/app/api/scenes/save/route.ts");
    const helper = read("apps/web/lib/scene/persist-scene-client.ts");
    const page = read("apps/web/app/(builder)/wonder-build/playcanvas/editor/[sceneId]/page.tsx");
    expect(route).toContain("supabase.auth.getUser(token)");
    expect(route).toContain("auth.user.id");
    expect(route).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(helper).toContain("result?.success === true");
    expect(page).toContain("if (!saved)");
    expect(page).toContain("editorRef.current?.loadScene?.(cleaned)");
  });
});
