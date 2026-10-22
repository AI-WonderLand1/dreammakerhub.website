import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { orbitFromCameraPosition, panOrbitTarget } from "../apps/web/lib/scene/orbit-controls";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("WonderPlay camera and lighting", () => {
  it("preserves an authored camera position when the orbit loop resumes", () => {
    const position: [number, number, number] = [0, 5, 10];
    const target: [number, number, number] = [0, 1, 0];
    const orbit = orbitFromCameraPosition(position, target);
    const phi = orbit.el * Math.PI / 180;
    const theta = orbit.az * Math.PI / 180;
    expect(target[0] + orbit.dist * Math.sin(phi) * Math.sin(theta)).toBeCloseTo(position[0]);
    expect(target[1] + orbit.dist * Math.cos(phi)).toBeCloseTo(position[1]);
    expect(target[2] + orbit.dist * Math.sin(phi) * Math.cos(theta)).toBeCloseTo(position[2]);
  });

  it("pans the orbit pivot in screen-aligned world space", () => {
    const target = { x: 0, y: 1, z: 0 };
    panOrbitTarget(target, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, 10, 5);
    expect(target.x).toBeCloseTo(-0.3);
    expect(target.y).toBeCloseTo(1.15);
    expect(target.z).toBeCloseTo(0);
    panOrbitTarget(target, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 }, 10, 0);
    expect(target.z).toBeCloseTo(0.3);
  });

  it("updates orbit state on scene loads and never translates just the camera while panning", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    expect(viewport).toContain("panOrbitTarget(orbitTargetRef.current, camera.right, camera.up, dx, dy)");
    expect(viewport).not.toContain("camera.translateLocal(-dx");
    expect(viewport).toContain("orbitRef.current = orbitFromCameraPosition(p, target)");
    expect(viewport).toContain("cameraPathRef.current.enabled = false");
  });

  it("orients directional lights along their local negative Y axis", () => {
    const viewport = source("apps/web/components/studio/StudioViewport.tsx");
    const loader = source("apps/web/lib/scene/loader.ts");
    for (const file of [viewport, loader]) {
      expect(file).toContain("new pc.Quat().setFromDirections(pc.Vec3.DOWN, direction)");
    }
    expect(viewport).not.toContain("entity.lookAt(-d[0]");
    expect(loader).toContain('light.type === "point" ? "omni"');
  });
});
