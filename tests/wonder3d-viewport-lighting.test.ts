import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { join } from 'node:path';
import * as THREE from 'three';
import ts from 'typescript';

const source = readFileSync(
  join(process.cwd(), 'apps/web/lib/wonder3d/components/ThreeViewport.tsx'),
  'utf8',
);

function section(start: string, end: string): string {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  if (startAt < 0 || endAt < 0) throw new Error('Viewport section not found');
  return source.slice(startAt, endAt);
}

function lightingRig() {
  const definition = section(
    '  const setupLighting = (scene: THREE.Scene, type: ViewportLighting): void => {',
    '  // Re-apply Render Mode Shaders/Materials',
  );
  const compiled = ts.transpileModule(definition, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  return runInNewContext(`${compiled}\nsetupLighting;`, { THREE }) as (
    scene: THREE.Scene, type: 'studio' | 'cyberpunk' | 'sunset' | 'void',
  ) => void;
}

describe('AI generator viewport camera and lighting regressions', () => {
  it('does not access out-of-scope type or scene while positioning the camera', () => {
    const camera = section('  // Update Camera position from orbit coordinates', '  // Re-create a single lighting rig');
    expect(camera).not.toMatch(/switch\s*\(\s*type\s*\)/);
    expect(camera).not.toMatch(/\bscene\s*\./);
    expect(camera).toContain('cameraRef.current.lookAt(0, 0, 0)');
  });

  it('creates working studio, cyberpunk, sunset, and void lighting rigs', () => {
    const applyLighting = lightingRig();
    const scene = new THREE.Scene();

    for (const mode of ['studio', 'cyberpunk', 'sunset', 'void'] as const) {
      applyLighting(scene, mode);
      const rigs = scene.children.filter((object) => object.name === 'wonder3d-viewport-lighting');
      expect(rigs).toHaveLength(1);
      expect(rigs[0].children.length).toBeGreaterThan(0);
      expect(rigs[0].children.every((object) => object instanceof THREE.Light)).toBe(true);
    }
  });

  it('replaces instead of accumulating scene lights on repeated changes', () => {
    const applyLighting = lightingRig();
    const scene = new THREE.Scene();
    applyLighting(scene, 'studio');
    const first = scene.getObjectByName('wonder3d-viewport-lighting');
    applyLighting(scene, 'cyberpunk');
    expect(scene.getObjectByName('wonder3d-viewport-lighting')).not.toBe(first);
    expect(scene.children).toHaveLength(1);
  });
});
