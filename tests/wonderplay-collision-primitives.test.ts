import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderPlay ground collisions", () => {
  it("uses valid PlayCanvas collision shapes for rendered planes", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    expect(viewport).not.toMatch(/addComponent\(["']collision["'],\s*\{\s*type:\s*["']plane["']/);
    expect(viewport).not.toMatch(/case ["']plane["]:\s*return\s*\{\s*type:\s*["']plane["']/);
    expect(viewport).toContain('return { type: "box", halfExtents: new pc.Vec3(sx / 2, 0.05, sz / 2) };');
    expect(viewport).toContain('ground.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(10, 0.05, 10) });');
  });

  it("keeps ground dimensions on the horizontal XZ plane", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    const gameWorld = source("apps/web/components/studio/StudioGameFoundation.tsx");
    const generator = source("apps/web/lib/scene/generateScene.ts");
    expect(viewport).toContain("ground.setLocalScale(20, 1, 20)");
    expect(viewport).toContain("grid.setLocalScale(20, 1, 20)");
    expect(gameWorld).toContain("scale: [28, 1, 28]");
    expect(generator).toContain("scale: [20, 1, 20]");
  });

  it("only raycasts when the optional physics world is active", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    expect(viewport).toContain("app.systems.rigidbody?.dynamicsWorld");
    expect(viewport).toContain("raycastFirst(from, to)");
  });

  it("bundles Ammo and loads it before creating the PlayCanvas application", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    const manifest = JSON.parse(source("package.json"));
    const lock = JSON.parse(source("package-lock.json"));
    expect(manifest.dependencies["sync-ammo"]).toBe("0.1.2");
    expect(lock.packages[""].dependencies["sync-ammo"]).toBe("0.1.2");
    expect(lock.packages["node_modules/sync-ammo"].version).toBe("0.1.2");
    expect(viewport.indexOf('await import("sync-ammo")')).toBeLessThan(viewport.indexOf("new pc.Application(canvas"));
    expect(viewport).toContain("app.systems.rigidbody.gravity = new pc.Vec3(0, -9.81, 0)");
  });

  it("uses valid cylinder dimensions and simulates only explicitly movable actors", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    const foundation = source("apps/web/components/studio/StudioGameFoundation.tsx");
    expect(viewport).toContain('return { type: "cylinder", radius: Math.max(sx, sz) / 2, height: sy };');
    expect(viewport).toContain("type: obj.physics.type");
    expect(foundation).toContain('actor.kind === "prop"');
    expect(foundation).toContain('type: "dynamic" as const, mass: 2');
    expect(foundation).toContain('type: "static" as const');
  });
});
