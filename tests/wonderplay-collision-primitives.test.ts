import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderPlay ground collisions", () => {
  it("uses valid PlayCanvas collision shapes for rendered planes", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    expect(viewport).not.toMatch(/addComponent\(["']collision["'],\s*\{\s*type:\s*["']plane["']/);
    expect(viewport).not.toMatch(/case ["']plane["]:\s*return\s*\{\s*type:\s*["']plane["']/);
    expect(viewport).toContain('return { type: "box", halfExtents: new pc.Vec3(0.5, 0.05, 0.5) };');
  });

  it("keeps ground dimensions on the horizontal XZ plane", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    const gameWorld = source("apps/web/components/studio/StudioGameFoundation.tsx");
    expect(viewport).toContain("ground.setLocalScale(20, 1, 20)");
    expect(viewport).toContain("grid.setLocalScale(20, 1, 20)");
    expect(gameWorld).toContain("scale: [28, 1, 28]");
  });

  it("only raycasts when the optional physics world is active", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    expect(viewport).toContain("app.systems.rigidbody?.dynamicsWorld");
    expect(viewport).toContain("raycastFirst(from, to)");
  });
});
