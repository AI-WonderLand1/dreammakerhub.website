"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import type { GeneratedScene, GeneratedSceneMaterial, GeneratedSceneObject } from "@/lib/scene/generateScene";
import { logger } from "@/lib/logger";

export type StudioSelection = { name: string; id: string; entityId?: number };

export type ViewportStats = { fps: number; entities: number; frames: number };

export type StudioViewportHandle = {
  renderScene: (scene: GeneratedScene) => void;
  clearScene: () => void;
  injectModel: (gltfUrl: string, assetId?: string) => void;
  getApp: () => any | null;
  getPc: () => any | null;
  renderPanorama: (opts?: PanoramaOpts) => void;
  clearPanorama: () => void;
  setToneMapping: (mode: ToneMappingMode) => void;
  setExposure: (value: number) => void;
  setFov: (fov: number) => void;
  placeActor: (opts: { name: string; type: string; x: number; y: number }) => void;
  clearActors: () => void;
  animateCameraPath: (opts: CameraPathOpts) => void;
  highlightEntity: (id: string | null) => void;
  captureSnapshot: () => string | null;
  setWireframe: (enabled: boolean) => void;
  setShadows: (enabled: boolean) => void;
  setAmbient: (color: [number, number, number], intensity?: number) => void;
  focusOn: (id: string | null) => void;
  getStats: () => ViewportStats;
  setShowGrid: (enabled: boolean) => void;
};

export type ToneMappingMode = "ACES" | "Filmic" | "HEJL" | "Linear" | "Neutral";

export type CameraPathOpts = {
  enabled: boolean;
  speed?: number;
  radius?: number;
  targetY?: number;
  lookAt?: [number, number, number];
  ease?: boolean;
};

export type PanoramaOpts = {
  exposure?: number;
  fov?: number;
  baseColor?: [number, number, number];
  skyColor?: [number, number, number];
  horizonColor?: [number, number, number];
  hotspotCount?: number;
  hotspotRadius?: number;
  skyboxUrl?: string;
};

export type StudioViewportProps = {
  onSelect?: (selection: StudioSelection) => void;
  onEntityCreated?: (entity: { name: string; id: string }) => void;
  className?: string;
  showGizmo?: boolean;
  showGrid?: boolean;
  showStats?: boolean;
  showFps?: boolean;
};

const TONE_MAPPING_CONSTANTS: Record<ToneMappingMode, string> = {
  ACES: "TONEMAP_ACES",
  Filmic: "TONEMAP_FILMIC",
  HEJL: "TONEMAP_HEJL",
  Linear: "TONEMAP_LINEAR",
  Neutral: "TONEMAP_NEUTRAL",
};

// Deterministic PRNG so hotspot placement is stable across renders
function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Build an equirectangular gradient texture on a 2D canvas
function buildEquirectTexture(
  base: [number, number, number],
  sky: [number, number, number],
  horizon: [number, number, number],
  width = 2048,
  height = 1024,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);
  const data = img.data;

  const lerpRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    lerp(a[0], b[0], t) * 255,
    lerp(a[1], b[1], t) * 255,
    lerp(a[2], b[2], t) * 255,
  ];

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const nv = v * 2 - 1;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const idx = (y * width + x) * 4;

      let color: [number, number, number];
      if (nv > 0.1) {
        const t = Math.pow((nv - 0.1) / 0.9, 0.8);
        color = lerpRgb(horizon, sky, t);
      } else {
        const t = (nv + 1) / 1.1;
        color = lerpRgb(horizon, base, Math.pow(t, 1.6));
      }

      // Sun glow streak near the horizon
      const sunX = 0.72;
      const sunDist = Math.abs(u - sunX) * width;
      const glow = Math.max(0, 1 - sunDist / (width * 0.08));
      color[0] += glow * 255 * 0.35;
      color[1] += glow * 255 * 0.3;
      color[2] += glow * 255 * 0.22;

      // Stars in the sky region
      if (nv > 0.45) {
        const hash = Math.sin(u * 127.1 + v * 311.7) * 43758.5453;
        const frac = hash - Math.floor(hash);
        if (frac > 0.985) {
          const star = (frac - 0.985) * 400;
          color[0] += star;
          color[1] += star;
          color[2] += star;
        }
      }

      data[idx] = Math.min(255, color[0]);
      data[idx + 1] = Math.min(255, color[1]);
      data[idx + 2] = Math.min(255, color[2]);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Build a subtle grid texture for the ground helper
function buildGridTexture(size = 512, divisions = 16, tint = [56, 189, 248]) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(148,163,184,0.14)";
  ctx.lineWidth = 1;
  const cell = size / divisions;
  for (let i = 0; i <= divisions; i++) {
    const p = i * cell;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  // Major axes tinted
  ctx.strokeStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},0.45)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();
  return canvas;
}

function materialFromSpec(pc: any, mat: GeneratedSceneMaterial): any {
  const m = new pc.StandardMaterial();
  if (mat.color) m.diffuse = new pc.Color(mat.color[0], mat.color[1], mat.color[2]);
  m.metalness = mat.metalness ?? 0;
  m.useMetalness = true;
  m.roughness = mat.roughness ?? 0.5;
  if (mat.emissive) m.emissive = new pc.Color(mat.emissive[0], mat.emissive[1], mat.emissive[2]);
  m.update();
  return m;
}

const PRIMITIVE_TYPES: Record<string, string> = {
  box: "box",
  sphere: "sphere",
  cylinder: "cylinder",
  plane: "plane",
  capsule: "capsule",
  cone: "cone",
  torus: "torus",
};

// Shape-accurate collision from primitive type + scale
function collisionForType(pc: any, type: string, scale?: [number, number, number]) {
  const [sx, sy, sz] = scale ?? [1, 1, 1];
  switch (type) {
    case "sphere":
      return { type: "sphere", radius: Math.max(sx, sy, sz) / 2 };
    case "capsule":
      return { type: "capsule", radius: Math.max(sx, sz) / 2, height: sy };
    case "cylinder":
      return { type: "cylinder", halfExtents: new pc.Vec3(sx / 2, sy / 2, sz / 2) };
    case "plane":
      return { type: "plane" };
    case "cone":
      // No native cone collision; approximate with a cylinder
      return { type: "cylinder", halfExtents: new pc.Vec3(sx / 2, sy / 2, sz / 2) };
    case "box":
    default:
      return { type: "box", halfExtents: new pc.Vec3(sx / 2, sy / 2, sz / 2) };
  }
}

const StudioViewport = forwardRef<StudioViewportHandle, StudioViewportProps>(
  function StudioViewport(
    { onSelect, onEntityCreated, className = "", showGizmo = true, showGrid: showGridProp = false, showStats = false, showFps = false },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<any>(null);
    const pcRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const selectedEntityRef = useRef<any>(null);
    const highlightIdRef = useRef<string | null>(null);
    const orbitRef = useRef({ dist: 9, az: 40, el: 30 });
    const orbitTargetRef = useRef({ x: 0, y: 1, z: 0 });
    const cameraPathRef = useRef<{ enabled: boolean; speed: number; radius: number; targetY: number; lookAt: [number, number, number]; ease: boolean; t: number }>({
      enabled: false,
      speed: 1,
      radius: 9,
      targetY: 1,
      lookAt: [0, 1, 0],
      ease: false,
      t: 0,
    });
    const baseLightsRef = useRef<any[]>([]);
    const groundRef = useRef<any>(null);
    const gridRef = useRef<any>(null);
    const sceneRootRef = useRef<any>(null);
    const actorRootRef = useRef<any>(null);
    const wireframeRef = useRef(false);
    const shadowsRef = useRef(true);
    const statsRef = useRef({ fps: 0, entities: 0, frames: 0, lastTime: 0 });
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const [stats, setStats] = useState<ViewportStats>({ fps: 0, entities: 0, frames: 0 });
    const onSelectRef = useRef(onSelect);
    const onEntityCreatedRef = useRef(onEntityCreated);
    const showGridRef = useRef(showGridProp);
    const showStatsRef = useRef(showStats);

    useEffect(() => {
      onSelectRef.current = onSelect;
      onEntityCreatedRef.current = onEntityCreated;
    }, [onSelect, onEntityCreated]);

    useEffect(() => {
      showGridRef.current = showGridProp;
    }, [showGridProp]);

    const forEachEntity = useCallback((root: any, fn: (e: any) => void) => {
      const walk = (ent: any) => {
        fn(ent);
        for (const c of ent.children ?? []) walk(c);
      };
      walk(root);
    }, []);

    const setupRaycastSelection = useCallback((app: any, cameraEntity: any) => {
      if (!app.mouse) return;
      const pc = app.constructor;

      app.mouse.on(pc.EVENT_MOUSEDOWN, (event: any) => {
        if (event.button !== 0) return;

        const startX = event.x;
        const startY = event.y;

        const near = cameraEntity.camera.screenToWorld(startX, startY, cameraEntity.camera.nearClip);
        const far = cameraEntity.camera.screenToWorld(startX, startY, cameraEntity.camera.farClip);
        const from = new pc.Vec3(near.x, near.y, near.z);
        const to = new pc.Vec3(far.x, far.y, far.z);
        const dir = to.clone().sub(from).normalize();

        let result: any = null;
        if (app.systems.rigidbody) {
          result = app.systems.rigidbody.raycastFirst(from, dir, 500);
        }
        if (!result) {
          try {
            const picked = app.systems.pick ? app.systems.pick.pick(startX, startY) : null;
            if (picked) result = { entity: picked };
          } catch (err) {
            logger.warn("Pick system error:", err);
          }
        }

        if (result?.entity) {
          const entity = result.entity;
          selectedEntityRef.current = entity;
          const name = entity.name || "untitled";
          const id = typeof entity.getGuid === "function" ? entity.getGuid() : `${name}-${entity.getIndex?.() ?? Date.now()}`;
          const selection: StudioSelection = { name, id, entityId: entity.getIndex?.() };
          window.dispatchEvent(new CustomEvent("onCanvasAssetSelected", { detail: selection }));
          onSelectRef.current?.(selection);

          // Flash a highlight ring: brief emissive boost
          try {
            const renderC = entity.render || entity.model;
            if (renderC && renderC.material) {
              const orig = renderC.material.emissive;
              renderC.material.emissive = new pc.Color(0.3, 0.9, 1);
              renderC.material.emissiveIntensity = 1.5;
              renderC.material.update();
              setTimeout(() => {
                if (renderC.material) {
                  renderC.material.emissive = orig;
                  renderC.material.emissiveIntensity = 0;
                  renderC.material.update();
                }
              }, 400);
            }
          } catch (err) {
            logger.warn("Highlight error:", err);
          }
        } else {
          selectedEntityRef.current = null;
          onSelectRef.current?.({ name: "", id: "" });
        }
      });
    }, []);

    const setupOrbitControls = useCallback((app: any, camera: any) => {
      const pc = app.constructor;
      let isDragging = false;
      let panning = false;
      let lastX = 0;
      let lastY = 0;

      const applyCamera = () => {
        const o = orbitRef.current;
        const t = orbitTargetRef.current;
        const rad = (d: number) => d * 0.0174533;
        const phi = rad(o.el);
        const theta = rad(o.az);
        const x = o.dist * Math.sin(phi) * Math.sin(theta) + t.x;
        const y = o.dist * Math.cos(phi) + t.y;
        const z = o.dist * Math.sin(phi) * Math.cos(theta) + t.z;
        camera.setPosition(x, y, z);
        camera.lookAt(t.x, t.y, t.z);
      };

      app.mouse.on(pc.EVENT_MOUSEDOWN, (e: any) => {
        if (e.button === 0) {
          isDragging = true;
          lastX = e.x;
          lastY = e.y;
        } else if (e.button === 2) {
          panning = true;
          lastX = e.x;
          lastY = e.y;
        }
      });

      app.mouse.on(pc.EVENT_MOUSEUP, () => {
        isDragging = false;
        panning = false;
      });

      app.mouse.on(pc.EVENT_MOUSEMOVE, (e: any) => {
        const dx = e.x - lastX;
        const dy = e.y - lastY;
        if (isDragging) {
          const o = orbitRef.current;
          o.az -= dx * 0.4;
          o.el = Math.max(5, Math.min(85, o.el + dy * 0.4));
        } else if (panning) {
          camera.translateLocal(-dx * 0.03, dy * 0.03, 0);
        }
        lastX = e.x;
        lastY = e.y;
      });

      app.mouse.on(pc.EVENT_MOUSEWHEEL, (e: any) => {
        const o = orbitRef.current;
        o.dist = Math.max(2, Math.min(40, o.dist + e.wheel * 0.3));
      });

      // Apply orbit on every frame unless a camera path is active
      app.on("update", () => {
        const path = cameraPathRef.current;
        if (path.enabled) {
          path.t += path.speed * 0.016;
          const theta = path.t * 0.35;
          const x = path.radius * Math.sin(theta);
          const z = path.radius * Math.cos(theta);
          camera.setPosition(x, path.targetY, z);
          camera.lookAt(path.lookAt[0], path.lookAt[1], path.lookAt[2]);
        } else {
          applyCamera();
        }
      });

      applyCamera();
    }, []);

    const setupGround = useCallback((app: any) => {
      const pc = app.constructor;
      const ground = new pc.Entity("Ground");
      ground.addComponent("render", { type: "plane" });
      ground.setLocalScale(20, 20, 1);
      ground.setPosition(0, -0.1, 0);
      const gm = new pc.StandardMaterial();
      gm.diffuse = new pc.Color(0.13, 0.13, 0.16);
      gm.roughness = 0.95;
      gm.metalness = 0;
      gm.update();
      ground.render.material = gm;
      ground.addComponent("rigidbody", { type: "static" });
      ground.addComponent("collision", { type: "plane" });
      app.root.addChild(ground);
      groundRef.current = ground;
      return ground;
    }, []);

    const setupGrid = useCallback((app: any, enabled: boolean) => {
      const pc = app.constructor;
      if (gridRef.current) {
        gridRef.current.enabled = enabled;
        return gridRef.current;
      }
      const grid = new pc.Entity("GridHelper");
      grid.addComponent("render", { type: "plane" });
      grid.setLocalScale(20, 20, 1);
      grid.setPosition(0, 0.005, 0);
      grid.render.castShadows = false;
      grid.render.receiveShadows = false;
      const texture = new pc.Texture(app.graphicsDevice, {
        width: 512,
        height: 512,
        format: pc.PIXELFORMAT_R8_G8_B8_A8,
        mipmaps: true,
      });
      texture.setSource(buildGridTexture());
      texture.addressU = pc.ADDRESS_REPEAT;
      texture.addressV = pc.ADDRESS_REPEAT;
      texture.minFilter = pc.FILTER_LINEAR_MIPMAP_LINEAR;
      texture.magFilter = pc.FILTER_LINEAR;
      const gm = new pc.StandardMaterial();
      gm.diffuseMap = texture;
      gm.diffuse = new pc.Color(1, 1, 1);
      gm.emissive = new pc.Color(1, 1, 1);
      gm.emissiveMap = texture;
      gm.emissiveIntensity = 0.9;
      gm.opacity = 0.9;
      gm.blendType = pc.BLEND_NORMAL;
      gm.depthWrite = false;
      gm.update();
      grid.render.material = gm;
      app.root.addChild(grid);
      grid.enabled = enabled;
      gridRef.current = grid;
      return grid;
    }, []);

    const setupLights = useCallback((app: any) => {
      const pc = app.constructor;
      const dir = new pc.Entity("DirLight");
      dir.addComponent("light", { type: "directional", color: new pc.Color(1, 1, 1), intensity: 1.1, castShadows: true });
      dir.setEulerAngles(45, 30, 0);
      app.root.addChild(dir);

      const amb = new pc.Entity("AmbLight");
      amb.addComponent("light", { type: "ambient", color: new pc.Color(0.35, 0.38, 0.5), intensity: 0.7 });
      app.root.addChild(amb);

      const rim = new pc.Entity("RimLight");
      rim.addComponent("light", { type: "directional", color: new pc.Color(0.2, 0.4, 0.7), intensity: 0.4 });
      rim.setEulerAngles(-30, -120, 0);
      app.root.addChild(rim);

      baseLightsRef.current = [dir, amb, rim];
    }, []);

    // Apply scene-authored lights under the scene root; disable base lights when present
    const applySceneLights = useCallback(
      (scene: GeneratedScene, root: any) => {
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc || !root) return;

        const lights = scene.lights ?? [];
        for (const light of baseLightsRef.current) {
          light.enabled = lights.length === 0;
        }
        if (lights.length === 0) return;

        for (const light of lights) {
          const entity = new pc.Entity(light.id || "SceneLight");
          const isDir = light.type === "directional";
          entity.addComponent("light", {
            type: light.type,
            color: new pc.Color(light.color[0], light.color[1], light.color[2]),
            intensity: light.intensity ?? 1,
            castShadows: isDir && shadowsRef.current,
          });

          if (isDir) {
            const d = light.direction ?? [0, -1, 0];
            // Directional lights shine toward -Z; orient so the light points along `d`
            entity.lookAt(-d[0] * 10, -d[1] * 10, -d[2] * 10);
          } else {
            if (light.position) entity.setPosition(light.position[0], light.position[1], light.position[2]);
          }
          root.addChild(entity);
        }
      },
      [],
    );

    const setupStatsLoop = useCallback((app: any) => {
      const now = performance.now();
      statsRef.current.lastTime = now;
      app.on("update", () => {
        statsRef.current.frames++;
        const t = performance.now();
        if (t - statsRef.current.lastTime >= 1000) {
          statsRef.current.fps = statsRef.current.frames;
          statsRef.current.frames = 0;
          statsRef.current.lastTime = t;

          let count = 0;
          const walk = (ent: any) => {
            count++;
            for (const c of ent.children ?? []) walk(c);
          };
          walk(app.root);
          statsRef.current.entities = count;
          if (showStatsRef.current) {
            setStats({ fps: statsRef.current.fps, entities: count, frames: 0 });
          }
        }
      });
    }, []);

    const handleRemoteMeshInjection = useCallback((e: Event) => {
      const customEvent = e as CustomEvent;
      const { gltfUrl, assetId } = customEvent.detail ?? {};
      const app = appRef.current;
      if (!app || !gltfUrl) return;

      app.assets.loadFromUrl(gltfUrl, "container", (err: Error | null, asset: any) => {
        if (err) {
          logger.error("PlayCanvas GLTF Loading Error:", err);
          return;
        }
        const pc = app.constructor;
        const targetEntity = new pc.Entity(`AI_Asset_${assetId ?? Date.now()}`);
        targetEntity.addComponent("model", { type: "asset", asset: asset.resource.model });
        targetEntity.addComponent("rigidbody", { type: "static" });
        targetEntity.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(0.5, 0.5, 0.5) });
        app.root.addChild(targetEntity);
        selectedEntityRef.current = targetEntity;
        onEntityCreatedRef.current?.({ name: targetEntity.name, id: `${assetId ?? Date.now()}` });
      });
    }, []);

    useEffect(() => {
      let disposed = false;
      let app: any = null;

      async function init() {
        try {
          const playcanvas = await import("playcanvas");
          if (disposed || !containerRef.current || !canvasRef.current) return;
          const pc = playcanvas;
          pcRef.current = pc;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
          if (!ctx) {
            setError("WebGL is not available in this browser");
            return;
          }

          app = new pc.Application(canvas, {
            graphicsDeviceOptions: { context: ctx },
            mouse: new pc.Mouse(canvas),
            touch: new pc.TouchDevice(canvas),
            elementInput: new pc.ElementInput(canvas),
          });
          appRef.current = app;
          app.start();

          const camera = new pc.Entity("Camera");
          camera.addComponent("camera", {
            clearColor: new pc.Color(0.07, 0.07, 0.12),
            fov: 50,
            nearClip: 0.1,
            farClip: 1000,
          });
          app.root.addChild(camera);
          cameraRef.current = camera;

          setupLights(app);
          setupGround(app);
          setupGrid(app, showGridProp);
          setupOrbitControls(app, camera);
          setupRaycastSelection(app, camera);
          setupStatsLoop(app);

          const resize = () => {
            if (containerRef.current && canvasRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              canvasRef.current.width = rect.width;
              canvasRef.current.height = rect.height;
              app.resizeCanvas(rect.width, rect.height);
            }
          };
          resize();
          window.addEventListener("resize", resize);
          (app as any)._resizeHandler = resize;

          window.addEventListener("injectRemoteAiModel", handleRemoteMeshInjection);
          (app as any)._injectHandler = handleRemoteMeshInjection;

          setReady(true);
        } catch (err: any) {
          setError(err instanceof Error ? err.message : "Failed to start 3D engine");
        }
      }

      void init();

      return () => {
        disposed = true;
        if (app) {
          window.removeEventListener("resize", (app as any)._resizeHandler);
          window.removeEventListener("injectRemoteAiModel", (app as any)._injectHandler);
          app.destroy();
        }
        appRef.current = null;
        pcRef.current = null;
      };
    }, [handleRemoteMeshInjection, setupGround, setupGrid, setupLights, setupOrbitControls, setupRaycastSelection, setupStatsLoop, showGridProp]);

    const renderScene = useCallback((scene: GeneratedScene) => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;

      const existing = app.root.findByName("__sceneRoot");
      if (existing) existing.destroy();
      const root = new pc.Entity("__sceneRoot");
      app.root.addChild(root);
      sceneRootRef.current = root;

      const materialCache = new Map<string, any>();
      for (const mat of scene.materials ?? []) {
        materialCache.set(mat.id, materialFromSpec(pc, mat));
      }

      for (const obj of scene.objects ?? []) {
        const entity = new pc.Entity(obj.name || "object");
        const renderType = PRIMITIVE_TYPES[obj.type] ?? "box";
        entity.addComponent("render", { type: renderType });

        if (obj.position) entity.setPosition(obj.position[0], obj.position[1], obj.position[2]);
        if (obj.rotation) entity.setEulerAngles(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
        if (obj.scale) entity.setLocalScale(obj.scale[0], obj.scale[1], obj.scale[2]);

        if (obj.material && materialCache.has(obj.material)) {
          entity.render.material = materialCache.get(obj.material);
        }

        entity.addComponent("rigidbody", { type: "static" });
        const coll = collisionForType(pc, obj.type, obj.scale);
        entity.addComponent("collision", coll);

        root.addChild(entity);

        // Load remote GLB mesh if provided
        if (obj.meshUrl) {
          app.assets.loadFromUrl(obj.meshUrl, "container", (err: Error | null, asset: any) => {
            if (err) {
              logger.warn(`Failed to load mesh ${obj.meshUrl}:`, err);
              return;
            }
            if (entity && entity.render) {
              entity.removeComponent("render");
              entity.addComponent("model", { type: "asset", asset: asset.resource.model });
              if (wireframeRef.current) {
                forEachEntity(entity, (e) => {
                  if (e.model?.meshInstances) {
                    e.model.meshInstances.forEach((mi: any) => (mi.style = pc.RENDERSTYLE_WIREFRAME));
                  }
                });
              }
            }
          });
        }
      }

      // Apply scene-authored lights (real light rig from the generated scene)
      applySceneLights(scene, root);

      // Apply scene camera
      const cam = cameraRef.current;
      if (cam && scene.camera) {
        cam.camera.fov = scene.camera.fov ?? 50;
        const p = scene.camera.position ?? [0, 5, 10];
        cam.setPosition(p[0], p[1], p[2]);
        if (scene.camera.target) {
          orbitTargetRef.current = { x: scene.camera.target[0], y: scene.camera.target[1], z: scene.camera.target[2] };
          cam.lookAt(scene.camera.target[0], scene.camera.target[1], scene.camera.target[2]);
        }
      }

      // Apply sky
      if (scene.sky?.color) {
        cam.camera.clearColor = new pc.Color(scene.sky.color[0], scene.sky.color[1], scene.sky.color[2]);
      }
    }, [applySceneLights, forEachEntity]);

    const clearScene = useCallback(() => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      const existing = app.root.findByName("__sceneRoot");
      if (existing) existing.destroy();
      sceneRootRef.current = null;
      for (const light of baseLightsRef.current) light.enabled = true;
      const cam = cameraRef.current;
      if (cam) {
        cam.camera.fov = 50;
        cam.camera.clearColor = new pc.Color(0.07, 0.07, 0.12);
        orbitRef.current = { dist: 9, az: 40, el: 30 };
        orbitTargetRef.current = { x: 0, y: 1, z: 0 };
      }
    }, []);

    const injectModel = useCallback((gltfUrl: string, assetId?: string) => {
      window.dispatchEvent(new CustomEvent("injectRemoteAiModel", { detail: { gltfUrl, assetId } }));
    }, []);

    const renderPanorama = useCallback(
      (opts?: PanoramaOpts) => {
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc) return;

        const existing = app.root.findByName("__sceneRoot");
        if (existing) existing.destroy();
        const root = new pc.Entity("__sceneRoot");
        app.root.addChild(root);
        sceneRootRef.current = root;

        const base = opts?.baseColor ?? [0.12, 0.3, 0.45];
        const sky = opts?.skyColor ?? [0.05, 0.1, 0.25];
        const horizon = opts?.horizonColor ?? [0.5, 0.42, 0.35];

        const applyTextureToSphere = (sphere: any, source: any) => {
          const texture = new pc.Texture(app.graphicsDevice, {
            width: source.width || 2048,
            height: source.height || 1024,
            format: pc.PIXELFORMAT_R8_G8_B8_A8,
            mipmaps: true,
          });
          texture.setSource(source);
          texture.addressU = pc.ADDRESS_REPEAT;
          texture.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
          texture.minFilter = pc.FILTER_LINEAR_MIPMAP_LINEAR;
          texture.magFilter = pc.FILTER_LINEAR;
          texture.anisotropy = 8;

          const mat = sphere.render.material;
          mat.diffuseMap = texture;
          mat.emissiveMap = texture;
          mat.diffuse = new pc.Color(1, 1, 1);
          mat.update();
        };

        const sphere = new pc.Entity("PanoramaSphere");
        sphere.addComponent("render", { type: "sphere" });
        sphere.setLocalScale(60, 60, 60);
        sphere.setPosition(0, 0, 0);

        const mat = new pc.StandardMaterial();
        mat.emissive = new pc.Color(1, 1, 1);
        mat.emissiveIntensity = opts?.exposure ?? 1.0;
        mat.lightMap = null;
        mat.diffuse = new pc.Color(1, 1, 1);
        mat.update();
        sphere.render.material = mat;
        sphere.render.castShadows = false;
        sphere.render.receiveShadows = false;
        root.addChild(sphere);

        // Procedural gradient fallback (always create, replaced if skyboxUrl loads)
        const procedural = buildEquirectTexture(base, sky, horizon);
        applyTextureToSphere(sphere, procedural);

        // If a real equirect image URL is given, load and apply it
        if (opts?.skyboxUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => applyTextureToSphere(sphere, img);
          img.onerror = () => logger.warn("Failed to load skybox image:", opts.skyboxUrl);
          img.src = opts.skyboxUrl;
        }

        // Hotspot markers on the panorama sphere
        const count = opts?.hotspotCount ?? 6;
        const radius = opts?.hotspotRadius ?? 5;
        const rand = seededRandom(1337 + count);
        for (let i = 0; i < count; i++) {
          const phi = rand() * Math.PI * 2;
          const theta = (rand() * 0.6 + 0.2) * Math.PI;
          const x = radius * Math.sin(theta) * Math.cos(phi);
          const y = radius * Math.cos(theta) + 1.6;
          const z = radius * Math.sin(theta) * Math.sin(phi);

          const marker = new pc.Entity(`Hotspot_${i + 1}`);
          marker.addComponent("render", { type: "sphere" });
          marker.setLocalScale(0.3, 0.3, 0.3);
          marker.setPosition(x, y, z);
          const mm = new pc.StandardMaterial();
          mm.diffuse = new pc.Color(1, 0.6, 0.15);
          mm.emissive = new pc.Color(1, 0.5, 0.1);
          mm.emissiveIntensity = 1.2;
          mm.update();
          marker.render.material = mm;
          marker.render.castShadows = false;
          marker.addComponent("rigidbody", { type: "static" });
          marker.addComponent("collision", { type: "sphere", radius: 0.3 });
          root.addChild(marker);
        }

        const cam = cameraRef.current;
        if (cam) {
          cam.camera.fov = opts?.fov ?? 90;
          cam.camera.clearColor = new pc.Color(0.02, 0.02, 0.04);
          cam.setPosition(0, 1.6, 0.01);
          cam.lookAt(0, 1.6, 0);
        }
        orbitRef.current = { dist: 0.01, az: 40, el: 5 };
        orbitTargetRef.current = { x: 0, y: 1.6, z: 0 };
      },
      [],
    );

    const clearPanorama = useCallback(() => {
      clearScene();
    }, [clearScene]);

    const setToneMapping = useCallback((mode: ToneMappingMode) => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      const constName = TONE_MAPPING_CONSTANTS[mode];
      const value = (pc as any)[constName];
      if (value !== undefined) {
        app.scene.toneMapping = value;
        app.scene.gammaCorrection = mode === "Linear" ? pc.GAMMA_NONE : pc.GAMMA_SRGB;
      }
    }, []);

    const setExposure = useCallback((value: number) => {
      const app = appRef.current;
      if (!app) return;
      app.scene.exposure = value;
      const root = app.root.findByName("__sceneRoot");
      if (root) {
        const sphere = root.findByName("PanoramaSphere");
        if (sphere?.render?.material) {
          sphere.render.material.emissiveIntensity = value;
          sphere.render.material.update();
        }
      }
    }, []);

    const setFov = useCallback((fov: number) => {
      const cam = cameraRef.current;
      if (cam) cam.camera.fov = fov;
    }, []);

    const placeActor = useCallback(
      (opts: { name: string; type: string; x: number; y: number }) => {
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc) return;

        if (!actorRootRef.current || !app.root.findByName("__actorRoot")) {
          const existing = app.root.findByName("__actorRoot");
          if (existing) existing.destroy();
          const actorRoot = new pc.Entity("__actorRoot");
          app.root.addChild(actorRoot);
          actorRootRef.current = actorRoot;
        }

        const typeMap: Record<string, string> = {
          System_Player_Rig: "box",
          Dynamic_Enemy_AI: "cone",
          Physics_Item_Crate: "box",
          Trigger_Zone_Volume: "sphere",
        };
        const renderType = typeMap[opts.type] ?? "box";
        const entity = new pc.Entity(opts.name || `Actor_${opts.x}_${opts.y}`);
        entity.addComponent("render", { type: renderType });
        const worldX = (opts.x / 12) * 20 - 10;
        const worldZ = (opts.y / 12) * 20 - 10;
        entity.setPosition(worldX, opts.type === "Physics_Item_Crate" ? 0.5 : 0.8, worldZ);
        entity.setLocalScale(0.8, 0.8, 0.8);

        const colors: Record<string, [number, number, number]> = {
          System_Player_Rig: [0.2, 0.6, 1],
          Dynamic_Enemy_AI: [1, 0.3, 0.3],
          Physics_Item_Crate: [0.7, 0.5, 0.2],
          Trigger_Zone_Volume: [0.3, 1, 0.6],
        };
        const mat = new pc.StandardMaterial();
        const c = colors[opts.type] ?? [0.5, 0.5, 0.8];
        mat.diffuse = new pc.Color(c[0], c[1], c[2]);
        mat.emissive = new pc.Color(c[0] * 0.3, c[1] * 0.3, c[2] * 0.3);
        mat.update();
        entity.render.material = mat;

        entity.addComponent("rigidbody", { type: "static" });
        entity.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(0.4, 0.4, 0.4) });
        actorRootRef.current.addChild(entity);
        onEntityCreatedRef.current?.({ name: entity.name, id: `${opts.x}-${opts.y}` });
        return entity;
      },
      [onEntityCreatedRef],
    );

    const clearActors = useCallback(() => {
      const app = appRef.current;
      if (!app) return;
      const existing = app.root.findByName("__actorRoot");
      if (existing) existing.destroy();
      actorRootRef.current = null;
    }, []);

    const animateCameraPath = useCallback((opts: CameraPathOpts) => {
      cameraPathRef.current = {
        enabled: opts.enabled,
        speed: opts.speed ?? 1,
        radius: opts.radius ?? 9,
        targetY: opts.targetY ?? 1,
        lookAt: opts.lookAt ?? [0, 1, 0],
        ease: opts.ease ?? false,
        t: cameraPathRef.current.t,
      };
    }, []);

    const highlightEntity = useCallback((id: string | null) => {
      highlightIdRef.current = id;
    }, []);

    const captureSnapshot = useCallback((): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL("image/png");
    }, []);

    const setWireframe = useCallback(
      (enabled: boolean) => {
        wireframeRef.current = enabled;
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc) return;
        const roots = [app.root.findByName("__sceneRoot"), app.root.findByName("__actorRoot")].filter(Boolean);
        const style = enabled ? pc.RENDERSTYLE_WIREFRAME : pc.RENDERSTYLE_SOLID;
        for (const root of roots) {
          forEachEntity(root, (e) => {
            const comp = e.render || e.model;
            if (comp?.meshInstances) {
              comp.meshInstances.forEach((mi: any) => (mi.style = style));
            }
          });
        }
      },
      [forEachEntity],
    );

    const setShadows = useCallback((enabled: boolean) => {
      shadowsRef.current = enabled;
      const app = appRef.current;
      if (!app) return;
      forEachEntity(app.root, (e) => {
        if (e.light) e.light.castShadows = enabled;
        if (e.render) e.render.castShadows = enabled;
      });
    }, [forEachEntity]);

    const setAmbient = useCallback((color: [number, number, number], intensity?: number) => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      const amb = baseLightsRef.current.find((l) => l.name === "AmbLight");
      if (amb?.light) {
        amb.light.color = new pc.Color(color[0], color[1], color[2]);
        if (intensity !== undefined) amb.light.intensity = intensity;
      }
    }, []);

    const focusOn = useCallback((id: string | null) => {
      const app = appRef.current;
      if (!app) return;
      if (!id) {
        orbitTargetRef.current = { x: 0, y: 1, z: 0 };
        return;
      }
      const target = app.root.findByGuid(id);
      if (target) {
        const pos = target.getPosition();
        orbitTargetRef.current = { x: pos.x, y: pos.y + 1, z: pos.z };
        orbitRef.current = { ...orbitRef.current, dist: 6 };
      }
    }, []);

    const getStats = useCallback((): ViewportStats => {
      return { fps: statsRef.current.fps, entities: statsRef.current.entities, frames: statsRef.current.frames };
    }, []);

    const setShowGrid = useCallback((enabled: boolean) => {
      showGridRef.current = enabled;
      const app = appRef.current;
      if (app) {
        if (!gridRef.current) setupGrid(app, enabled);
        else gridRef.current.enabled = enabled;
      }
    }, [setupGrid]);

    useImperativeHandle(ref, () => ({
      renderScene,
      clearScene,
      injectModel,
      getApp: () => appRef.current,
      getPc: () => pcRef.current,
      renderPanorama,
      clearPanorama,
      setToneMapping,
      setExposure,
      setFov,
      placeActor,
      clearActors,
      animateCameraPath,
      highlightEntity,
      captureSnapshot,
      setWireframe,
      setShadows,
      setAmbient,
      focusOn,
      getStats,
      setShowGrid,
    }));

    const showStatsUi = showStats || showFps;

    return (
      <div ref={containerRef} className={`relative overflow-hidden bg-[radial-gradient(ellipse_at_center,#1e293b,#020617)] ${className}`}>
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />

        {showStatsUi && (
          <div className="pointer-events-none absolute top-2 right-2 flex flex-col items-end space-y-1 text-[10px] font-mono text-emerald-400/80 bg-slate-950/70 backdrop-blur border border-slate-800/60 px-2.5 py-1.5 rounded-lg">
            <span className="text-slate-500 text-[9px] tracking-widest">VIEWPORT STATS</span>
            <span>FPS {stats.fps}</span>
            <span>ENTITIES {stats.entities}</span>
          </div>
        )}

        {showGizmo && ready && (
          <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col items-end space-y-1 text-[10px] font-mono text-white/30">
            <span>+Y</span>
            <div className="flex items-center space-x-1">
              <span>+Z</span>
              <span className="px-1 py-0.5 rounded bg-white/5 text-white/50">drag orbit · wheel zoom · r-click pan</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  },
);

export default StudioViewport;
