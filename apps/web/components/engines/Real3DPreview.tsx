'use client';

import { useEffect, useRef } from 'react';

type ThreeNamespace = typeof import('three');

interface SceneNodeData {
  id?: string;
  type?: string;
  mesh?: string;
  transform?: { position?: number[]; rotation?: number[]; scale?: number[] };
  material?: {
    color?: number[];
    emissive?: number[];
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
  };
}

interface Real3DPreviewProps {
  /** Deterministic scene key — same seed always renders the same composition. */
  seed?: string;
  /** Optional real GLB asset; falls back to node/procedural scene on error. */
  glbUrl?: string;
  /** Real scene node data from a saved template (the same nodes the editors build from). */
  sceneData?: { nodes?: SceneNodeData[]; environment?: { skybox?: string; ambient?: number[] } };
  /** Hints the scene type: city | nature | space | product | abstract. */
  preset?: string;
  className?: string;
  style?: React.CSSProperties;
}

const THEMES = [
  { bg: 0x0b1026, fog: 0x0b1026, ground: 0x182048, sky: 0x4a5cff, key: 0xffffff, accent: 0xff3d81, accent2: 0x39d5ff },
  { bg: 0x0a0a12, fog: 0x0a0a12, ground: 0x1c1c26, sky: 0xffffff, key: 0xffffff, accent: 0x7c5cff, accent2: 0x22e5c8 },
  { bg: 0x0e1a12, fog: 0x0e1a12, ground: 0x1d3a2a, sky: 0xddffd2, key: 0xffffff, accent: 0xffb86b, accent2: 0x9bffd3 },
  { bg: 0x1a0d20, fog: 0x1a0d20, ground: 0x2a1338, sky: 0xc89bff, key: 0xffffff, accent: 0xff9a3d, accent2: 0x62c6ff },
  { bg: 0x0d1017, fog: 0x0d1017, ground: 0x1d2433, sky: 0xe8e2ff, key: 0xffffff, accent: 0x3dffa8, accent2: 0x4d7cff },
];

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function detectKind(seed: string, preset: string): 'city' | 'nature' | 'space' | 'product' | 'abstract' {
  const key = `${preset} ${seed}`.toLowerCase();
  if (/city|building|urban|futuristic|neon|scifi|skyline|corporate|3d website/.test(key)) return 'city';
  if (/beach|nature|forest|ocean|island|tropical|mountain|desert|palm/.test(key)) return 'nature';
  if (/space|planet|galaxy|star|nebula|orbit/.test(key)) return 'space';
  if (/product|showcase|studio|tech|gadget|yacht|watch|car/.test(key)) return 'product';
  return 'abstract';
}

export default function Real3DPreview({ seed = '', glbUrl, sceneData, preset = '', className = '', style }: Real3DPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let initToken = 0;

    const init = async () => {
      const token = ++initToken;
      const THREE: ThreeNamespace = await import('three');
      if (disposed || token !== initToken) return;

      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const kind = detectKind(seed, preset);
      const theme = THEMES[hashString(seed || kind) % THEMES.length];

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(theme.bg);
      scene.fog = new THREE.Fog(theme.fog, 22, 48);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
      const pivot = new THREE.Group();
      const lookTarget = new THREE.Vector3(0, 1.6, 0);
      scene.add(pivot);

      const lightSky = new THREE.HemisphereLight(theme.sky, theme.ground, 0.75);
      scene.add(lightSky);
      const lightKey = new THREE.DirectionalLight(theme.key, 1.35);
      lightKey.position.set(5, 9, 6);
      scene.add(lightKey);
      const lightAccent = new THREE.PointLight(theme.accent, 2.2, 16, 2);
      lightAccent.position.set(-5, 3, -4);
      scene.add(lightAccent);
      const lightRim = new THREE.PointLight(theme.accent2, 1.6, 15, 2);
      lightRim.position.set(4, 2, -5);
      scene.add(lightRim);

      const mat = (color: number, opts: Record<string, unknown> = {}) =>
        new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.35, ...opts });

      const addGround = () => {
        const ground = new THREE.Mesh(new THREE.CircleGeometry(13, 48), mat(theme.ground, { roughness: 0.9, metalness: 0 }));
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.06;
        pivot.add(ground);
        const grid = new THREE.GridHelper(26, 26, theme.accent2, theme.accent);
        (grid.material as any).opacity = 0.18;
        (grid.material as any).transparent = true;
        grid.position.y = 0;
        pivot.add(grid);
      };

      const addStarfield = (count = 220) => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r = 28 + Math.random() * 22;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.7 }));
        pivot.add(points);
      };

      const rand = mulberry32(hashString(seed || kind));
      const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
      const range = (min: number, max: number) => min + rand() * (max - min);

      let hasContent = false;

      // Build the preview from real scene node data (the same nodes the editors render).
      const buildFromNodes = async (nodes: SceneNodeData[]) => {
        const sceneColor = (arr?: number[], fallback = 0xffffff) =>
          arr ? new THREE.Color(arr[0], arr[1], arr[2]) : new THREE.Color(fallback);
        const meshMaterial = (n: SceneNodeData) => {
          const color = sceneColor(n.material?.color, 0x9aa0a6);
          const m = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.3 });
          if (n.material?.emissive && (n.material.emissive[0] || n.material.emissive[1] || n.material.emissive[2])) {
            m.emissive = new THREE.Color(n.material.emissive[0], n.material.emissive[1], n.material.emissive[2]);
            m.emissiveIntensity = n.material.emissiveIntensity ?? 1;
          }
          if (n.material?.transparent != null) {
            m.transparent = n.material.transparent;
            if (n.material.opacity != null) m.opacity = n.material.opacity;
          }
          return m;
        };

        nodes.forEach((n) => {
          if (n?.type !== 'mesh' || !n.mesh) return;
          const pos = n.transform?.position || [0, 0, 0];
          const sc = n.transform?.scale || [1, 1, 1];
          const mat = meshMaterial(n);
          const id = (n.id || '').toLowerCase();
          let mesh: THREE.Mesh;

          if (n.mesh === 'plane') {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(sc[0], Math.max(0.1, sc[1]), sc[2]), mat);
            mesh.position.set(pos[0], Math.min(pos[1], 0), pos[2]);
            mesh.scale.y = 1;
          } else if (n.mesh === 'cylinder') {
            const r = Math.max(0.05, sc[0] / 2);
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, sc[1], 14), mat);
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (/palm|tree/.test(id)) {
              const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e9c57, roughness: 0.9 });
              for (let i = 0; i < 5; i++) {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(r * 4, 8, 6), leafMat);
                leaf.scale.set(1, 0.35, 1);
                leaf.position.set(pos[0], pos[1] + sc[1] / 2 + r * 3.2, pos[2]);
                leaf.rotation.set([-0.6, 0.2, 0.7, -0.2][i], i * 1.2, 0);
                pivot.add(leaf);
              }
            }
          } else {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(sc[0], sc[1], sc[2]), mat);
            mesh.position.set(pos[0], pos[1], pos[2]);
          }
          pivot.add(mesh);
        });

        if (glbUrl) {
          try {
            const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(glbUrl);
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 4 / maxDim;
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            model.position.y = 0;
            model.traverse((node: any) => {
              if (node.isMesh) {
                if (Array.isArray(node.material)) node.material.forEach((m: any) => (m.metalness = Math.min(m.metalness ?? 0, 0.7)));
                else if (node.material) node.material.metalness = Math.min(node.material.metalness ?? 0, 0.7);
              }
            });
            pivot.add(model);
            hasContent = true;
          } catch {
            /* keep node scene */
          }
        }

        const env = sceneData?.environment;
        if (env?.ambient) {
          scene.background = new THREE.Color(env.ambient[0], env.ambient[1], env.ambient[2]);
          scene.fog = new THREE.Fog(scene.background as THREE.Color, 18, 46);
        }

        const box = new THREE.Box3().setFromObject(pivot);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        const dist = maxDim * 1.55 + 4.5;
        camera.position.set(dist * 0.78, dist * 0.55, dist * 0.82);
        camera.lookAt(center.x, center.y * 0.95, center.z);
        lookTarget.copy(center);
        hasContent = true;
      };

      if (glbUrl && (!sceneData?.nodes || sceneData.nodes.length === 0)) {
        try {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          const loader = new GLTFLoader();
          const gltf = await loader.loadAsync(glbUrl);
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 4 / maxDim;
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));
          model.position.y = 0;
          model.traverse((node: any) => {
            if (node.isMesh) {
              if (Array.isArray(node.material)) node.material.forEach((m: any) => (m.metalness = Math.min(m.metalness ?? 0, 0.7)));
              else if (node.material) node.material.metalness = Math.min(node.material.metalness ?? 0, 0.7);
            }
          });
          pivot.add(model);
          addGround();
          addStarfield();
          camera.position.set(6.5, 4.6, 7.5);
          camera.lookAt(0, 0.8, 0);
          hasContent = true;
        } catch {
          /* fall through to procedural */ }
      }

      if (!hasContent && sceneData?.nodes && sceneData.nodes.length > 0) {
        await buildFromNodes(sceneData.nodes);
      }

      if (!hasContent) {
        if (kind === 'city') {
          addGround();
          const n = 6;
          for (let i = 0; i < n * n; i++) {
            const rCol = i % n, rRow = Math.floor(i / n);
            const h = range(0.8, 5.4) * (Math.abs((rCol + rRow) % 3 - 1) + 0.7);
            const w = range(0.7, 1.4), d = range(0.7, 1.4);
            const bx = (rCol - n / 2) * 1.7 + range(-0.25, 0.25);
            const bz = (rRow - n / 2) * 1.7 + range(-0.25, 0.25);
            const building = new THREE.Mesh(
              new THREE.BoxGeometry(w, h, d),
              mat(pick([0x1a2340, 0x232d55, 0x2c3670]), { roughness: 0.7, metalness: 0.6 })
            );
            building.position.set(bx, h / 2, bz);
            pivot.add(building);
            if (rand() > 0.55) {
              const panel = new THREE.Mesh(
                new THREE.BoxGeometry(w * 0.98, h * 0.98, d * 0.99),
                new THREE.MeshStandardMaterial({ color: 0x0a0e1f, emissive: pick([theme.accent, theme.accent2]), emissiveIntensity: 0.7 })
              );
              panel.position.copy(building.position);
              pivot.add(panel);
            }
            if (rand() > 0.75) {
              const antenna = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, h * 0.4),
                mat(theme.accent, { emissive: theme.accent, emissiveIntensity: 1.4 })
              );
              antenna.position.set(bx, h + h * 0.2, bz);
              pivot.add(antenna);
            }
          }
          for (let i = 0; i < 3; i++) {
            const beam = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.15, 3.2, 8),
              new THREE.MeshStandardMaterial({ color: theme.accent2, emissive: theme.accent2, emissiveIntensity: 1.2, transparent: true, opacity: 0.6 })
            );
            beam.position.set(range(-4, 4), 1.6, range(-4, 4));
            pivot.add(beam);
          }
          camera.position.set(7, 5.2, 8);
          camera.lookAt(0, 1.6, 0);
        } else if (kind === 'nature') {
          const sand = new THREE.Mesh(new THREE.CircleGeometry(14, 48), mat(0xcbb487, { roughness: 1, metalness: 0 }));
          sand.rotation.x = -Math.PI / 2;
          sand.position.y = -0.08;
          pivot.add(sand);
          const ocean = new THREE.Mesh(
            new THREE.RingGeometry(8.5, 20, 64),
            new THREE.MeshStandardMaterial({ color: 0x1e7cc0, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
          );
          ocean.rotation.x = -Math.PI / 2;
          ocean.position.y = -0.05;
          pivot.add(ocean);
          const grid = new THREE.GridHelper(26, 26, 0xffffff, 0xffffff);
          (grid.material as any).opacity = 0.12;
          (grid.material as any).transparent = true;
          pivot.add(grid);
          const addPalm = (x: number, z: number) => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.6, 7), mat(0x8a5d33, { roughness: 1 }));
            trunk.position.set(x, 1.3, z);
            trunk.rotation.z = range(-0.15, 0.25);
            pivot.add(trunk);
            for (let i = 0; i < 5; i++) {
              const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.9, 6, 4), mat(0x2e9c57, { roughness: 0.9 }));
              leaf.scale.set(1, 0.35, 1);
              leaf.position.set(x, 2.6, z);
              leaf.rotation.set(pick([-0.6, 0.2, 0.7, -0.2]), range(0, Math.PI * 2), 0);
              pivot.add(leaf);
            }
            const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), mat(0x37b061, { roughness: 0.9 }));
            crown.position.set(x, 2.8, z);
            pivot.add(crown);
          };
          addPalm(-3.2, -2.4); addPalm(2.6, -3.6); addPalm(0.4, -1.2);
          for (let i = 0; i < 4; i++) {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(range(0.25, 0.6)), mat(0x9aa0a6, { roughness: 1 }));
            rock.position.set(range(-5, 5), 0.2, range(-5, 3));
            rock.rotation.set(range(0, 3.1), range(0, 3.1), 0);
            pivot.add(rock);
          }
          const sun = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 24, 24),
            new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffc94d, emissiveIntensity: 1.1 })
          );
          sun.position.set(7, 5.5, -8);
          pivot.add(sun);
          camera.position.set(8, 5, 7.5);
          camera.lookAt(0, 1.2, 0);
        } else if (kind === 'space') {
          addStarfield(320);
          const planet = new THREE.Mesh(new THREE.SphereGeometry(2.6, 48, 48), mat(0x2a3a66, { roughness: 0.35, metalness: 0.1 }));
          pivot.add(planet);
          const band = new THREE.Mesh(
            new THREE.TorusGeometry(3.6, 0.05, 12, 80),
            mat(theme.accent, { emissive: theme.accent, emissiveIntensity: 0.9 })
          );
          band.rotation.x = Math.PI / 2.6;
          pivot.add(band);
          const band2 = new THREE.Mesh(
            new THREE.TorusGeometry(4.1, 0.02, 8, 80),
            mat(theme.accent2, { emissive: theme.accent2, emissiveIntensity: 0.8 })
          );
          band2.rotation.x = Math.PI / 2.6;
          band2.rotation.y = 0.4;
          pivot.add(band2);
          for (let i = 0; i < 5; i++) {
            const moon = new THREE.Mesh(
              new THREE.SphereGeometry(range(0.16, 0.42), 18, 18),
              mat(pick([0xff9a3d, 0x9dc8ff, 0x22c9a3]))
            );
            const a = (i / 5) * Math.PI * 2;
            moon.position.set(Math.cos(a) * 5.4, Math.sin(a) * 2.2 - 0.6, Math.sin(a) * 5.4);
            pivot.add(moon);
          }
          camera.position.set(7, 3.4, 8);
          camera.lookAt(0, 0, 0);
        } else if (kind === 'product') {
          addGround();
          const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.1, 0.5, 40), mat(0x1d2433, { roughness: 0.45, metalness: 0.8 }));
          pedestal.position.y = 0.25;
          pivot.add(pedestal);
          const hero = new THREE.Mesh(
            new THREE.TorusKnotGeometry(1.15, 0.36, 96, 14),
            mat(pick([theme.accent, theme.accent2, 0x66aaff]), { roughness: 0.18, metalness: 0.95 })
          );
          hero.position.y = 1.9;
          pivot.add(hero);
          const halo = new THREE.Mesh(
            new THREE.RingGeometry(2.1, 2.35, 48),
            new THREE.MeshStandardMaterial({ color: theme.accent, emissive: theme.accent, emissiveIntensity: 1.1, transparent: true, opacity: 0.5 })
          );
          halo.rotation.x = Math.PI / 2.3;
          halo.position.y = 1.9;
          pivot.add(halo);
          for (let i = 0; i < 4; i++) {
            const orbGeo = new THREE.SphereGeometry(0.28, 14, 14);
            const orb = new THREE.Mesh(orbGeo, mat(pick([theme.accent, theme.accent2, 0xffffff]), { metalness: 0.7 }));
            const a = (i / 4) * Math.PI * 2;
            orb.position.set(Math.cos(a) * 2.9, 0.4, Math.sin(a) * 2.9);
            pivot.add(orb);
          }
          camera.position.set(6.6, 4.2, 7.4);
          camera.lookAt(0, 1.6, 0);
        } else {
          addGround();
          const prims = [
            { type: 'box' as const }, { type: 'sphere' as const }, { type: 'cone' as const },
            { type: 'torus' as const }, { type: 'ico' as const },
          ];
          const count = 7;
          for (let i = 0; i < count; i++) {
            const p = pick(prims).type;
            const scale = range(0.6, 1.5);
            const colors = [theme.accent, theme.accent2, 0xffffff, 0x8f8fff, 0x9d6bff];
            const c = pick(colors);
            let mesh: any;
            if (p === 'sphere') mesh = new THREE.Mesh(new THREE.SphereGeometry(scale, 20, 20), mat(c, { roughness: range(0.15, 0.5), metalness: range(0.2, 0.9) }));
            else if (p === 'torus') mesh = new THREE.Mesh(new THREE.TorusGeometry(scale, scale * 0.35, 12, 28), mat(c, { roughness: 0.3, metalness: 0.8 }));
            else if (p === 'cone') mesh = new THREE.Mesh(new THREE.ConeGeometry(scale, scale * 1.6, 20), mat(c, { roughness: 0.5, metalness: 0.5 }));
            else if (p === 'ico') mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(scale, 0), mat(c, { roughness: 0.25, metalness: 0.7 }));
            else mesh = new THREE.Mesh(new THREE.BoxGeometry(scale, scale, scale), mat(c, { roughness: 0.4, metalness: 0.6 }));
            const a = (i / count) * Math.PI * 2 + rand() * 0.8;
            const r = range(1.6, 4.6);
            mesh.position.set(Math.cos(a) * r, scale, Math.sin(a) * r);
            mesh.rotation.set(range(0, 3.1), range(0, 3.1), range(0, 3.1));
            pivot.add(mesh);
          }
          for (let i = 0; i < 3; i++) {
            const orb = new THREE.Mesh(
              new THREE.SphereGeometry(range(0.12, 0.22), 12, 12),
              new THREE.MeshStandardMaterial({ color: pick([theme.accent, theme.accent2]), emissive: pick([theme.accent, theme.accent2]), emissiveIntensity: 1.6 })
            );
            orb.position.set(range(-1.5, 1.5), range(2.5, 4.2), range(-1.5, 1.5));
            pivot.add(orb);
          }
          camera.position.set(6.5, 4.6, 7.5);
          camera.lookAt(0, 0.9, 0);
        }
      }

      // Seed-driven camera variety: cards in a grid never look identical.
      if (!hasContent) {
        const swing = ((hashString(seed || kind) % 360) / 180) * Math.PI * 0.45;
        const radius = Math.hypot(camera.position.x - lookTarget.x, camera.position.z - lookTarget.z);
        const curAz = Math.atan2(camera.position.z - lookTarget.z, camera.position.x - lookTarget.x);
        const az = curAz + swing;
        camera.position.x = lookTarget.x + Math.cos(az) * radius;
        camera.position.z = lookTarget.z + Math.sin(az) * radius;
        camera.position.y = lookTarget.y + (camera.position.y - lookTarget.y) * 0.9 + 0.5;
        camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
      }

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'low-power',
        alpha: false,
        preserveDrawingBuffer: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const canvas = renderer.domElement;
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      el.appendChild(canvas);

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const pointer = { x: 0, y: 0, active: false };
      const onPointerMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
        pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
      };
      const onEnter = () => (pointer.active = true);
      const onLeave = () => (pointer.active = false);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerenter', onEnter);
      el.addEventListener('pointerleave', onLeave);

      let raf = 0;
      let last = performance.now();
      let running = false;

      const frame = (now: number) => {
        if (!running) return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!reduceMotion) pivot.rotation.y += dt * 0.35;
        if (pointer.active && !reduceMotion) {
          camera.position.x += (pointer.x * 1.4 - camera.position.x) * 0.05;
          camera.position.y += (-pointer.y * 0.9 - (camera.position.y - (lookTarget.y + 2.5))) * 0.05 + (lookTarget.y + 2.5);
          camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };

      const start = () => {
        if (running || disposed) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };
      const stop = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };

      renderer.render(scene, camera);
      let visible = false;
      const io = new IntersectionObserver(
        (entries) => {
          const isVisible = entries[0].isIntersecting;
          if (isVisible && !visible) start();
          else if (!isVisible && visible) stop();
          visible = isVisible;
        },
        { rootMargin: '80px' }
      );
      io.observe(el);

      return () => {
        disposed = true;
        stop();
        io.disconnect();
        ro.disconnect();
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerenter', onEnter);
        el.removeEventListener('pointerleave', onLeave);
        try {
          renderer.dispose();
        } catch {}
        if (canvas.parentNode === el) el.removeChild(canvas);
        scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          const mm = obj.material as any;
          if (Array.isArray(mm)) mm.forEach((x: any) => x.dispose && x.dispose());
          else if (mm && mm.dispose) mm.dispose();
        });
      };
    };

    init().catch(() => {});
    return () => {
      disposed = true;
      initToken++;
    };
  }, [seed, glbUrl, preset, sceneData]);

  return <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={style} />;
}