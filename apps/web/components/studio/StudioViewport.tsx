"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import type { GeneratedScene, GeneratedSceneMaterial, GeneratedSceneObject } from "@/lib/scene/generateScene";
import { logger } from "@/lib/logger";

export type StudioSelection = { name: string; id: string; entityId?: number };

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
  animateCameraPath: (opts: { enabled: boolean; speed?: number; radius?: number; targetY?: number }) => void;
  highlightEntity: (id: string | null) => void;
};

export type ToneMappingMode = "ACES" | "Filmic" | "HEJL" | "Linear" | "Neutral";

export type PanoramaOpts = {
  exposure?: number;
  fov?: number;
  baseColor?: [number, number, number];
  skyColor?: [number, number, number];
  horizonColor?: [number, number, number];
  hotspotCount?: number;
  hotspotRadius?: number;
};

export type StudioViewportProps = {
  onSelect?: (selection: StudioSelection) => void;
  onEntityCreated?: (entity: { name: string; id: string }) => void;
  className?: string;
  showGizmo?: boolean;
};

const LOOK_AT = [0, 1, 0] as const;

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

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const lerpRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    lerp(a[0], b[0], t) * 255,
    lerp(a[1], b[1], t) * 255,
    lerp(a[2], b[2], t) * 255,
  ];

  for (let y = 0; y < height; y++) {
    const v = y / height;
    // -1 at bottom, +1 at top
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

const StudioViewport = forwardRef<StudioViewportHandle, StudioViewportProps>(
  function StudioViewport({ onSelect, onEntityCreated, className = "", showGizmo = true }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<any>(null);
    const pcRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const selectedEntityRef = useRef<any>(null);
    const highlightIdRef = useRef<string | null>(null);
    const orbitRef = useRef({ dist: 9, az: 40, el: 30 });
    const cameraPathRef = useRef<{ enabled: boolean; speed: number; radius: number; targetY: number; t: number }>({
      enabled: false,
      speed: 1,
      radius: 9,
      targetY: 1,
      t: 0,
    });
    const groundRef = useRef<any>(null);
    const sceneRootRef = useRef<any>(null);
    const actorRootRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const onSelectRef = useRef(onSelect);
    const onEntityCreatedRef = useRef(onEntityCreated);

    useEffect(() => {
      onSelectRef.current = onSelect;
      onEntityCreatedRef.current = onEntityCreated;
    }, [onSelect, onEntityCreated]);

    const setupRaycastSelection = useCallback((app: any, cameraEntity: any) => {
      if (!app.mouse) return;
      const pc = app.constructor;

      app.mouse.on(pc.EVENT_MOUSEDOWN, (event: any) => {
        if (event.button !== 0) return;

        // Only pick if we're not dragging (check if pointer moved enough)
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
        const rad = (d: number) => d * 0.0174533;
        const phi = rad(o.el);
        const theta = rad(o.az);
        const x = o.dist * Math.sin(phi) * Math.sin(theta) + LOOK_AT[0];
        const y = o.dist * Math.cos(phi) + LOOK_AT[1];
        const z = o.dist * Math.sin(phi) * Math.cos(theta) + LOOK_AT[2];
        camera.setPosition(x, y, z);
        camera.lookAt(LOOK_AT[0], LOOK_AT[1], LOOK_AT[2]);
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
          camera.lookAt(0, 1, 0);
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
          setupOrbitControls(app, camera);
          setupRaycastSelection(app, camera);

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
    }, [handleRemoteMeshInjection, setupGround, setupLights, setupOrbitControls, setupRaycastSelection]);

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
        entity.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(0.5, 0.5, 0.5) });

        root.addChild(entity);
      }

      // Apply scene camera
      const cam = cameraRef.current;
      if (cam && scene.camera) {
        cam.camera.fov = scene.camera.fov ?? 50;
        cam.setPosition(scene.camera.position?.[0] ?? 0, scene.camera.position?.[1] ?? 5, scene.camera.position?.[2] ?? 10);
        if (scene.camera.target) {
          cam.lookAt(scene.camera.target[0], scene.camera.target[1], scene.camera.target[2]);
        }
      }

      // Apply sky
      if (scene.sky?.color) {
        cam.camera.clearColor = new pc.Color(scene.sky.color[0], scene.sky.color[1], scene.sky.color[2]);
      }
    }, []);

    const clearScene = useCallback(() => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      const existing = app.root.findByName("__sceneRoot");
      if (existing) existing.destroy();
      sceneRootRef.current = null;
      const cam = cameraRef.current;
      if (cam) {
        cam.camera.fov = 50;
        cam.camera.clearColor = new pc.Color(0.07, 0.07, 0.12);
        orbitRef.current = { dist: 9, az: 40, el: 30 };
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

        const canvas = buildEquirectTexture(base, sky, horizon);
        const texture = new pc.Texture(app.graphicsDevice, {
          width: canvas.width,
          height: canvas.height,
          format: pc.PIXELFORMAT_R8_G8_B8_A8,
          mipmaps: true,
        });
        texture.setSource(canvas);
        texture.addressU = pc.ADDRESS_REPEAT;
        texture.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
        texture.minFilter = pc.FILTER_LINEAR_MIPMAP_LINEAR;
        texture.magFilter = pc.FILTER_LINEAR;
        texture.anisotropy = 8;

        const sphere = new pc.Entity("PanoramaSphere");
        sphere.addComponent("render", { type: "sphere" });
        sphere.setLocalScale(60, 60, 60);
        sphere.setPosition(0, 0, 0);

        const mat = new pc.StandardMaterial();
        mat.diffuseMap = texture;
        mat.emissiveMap = texture;
        mat.emissive = new pc.Color(1, 1, 1);
        mat.emissiveIntensity = opts?.exposure ?? 1.0;
        mat.lightMap = null;
        mat.diffuse = new pc.Color(1, 1, 1);
        mat.update();
        sphere.render.material = mat;
        sphere.render.castShadows = false;
        sphere.render.receiveShadows = false;
        root.addChild(sphere);

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
      },
      [],
    );

    const clearPanorama = useCallback(() => {
      clearScene();
    }, [clearScene]);

    const setToneMapping = useCallback((mode: ToneMappingMode) => {
      const app = appRef.current;
      if (!app) return;
      const pc = pcRef.current;
      if (!pc) return;
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
      [],
    );

    const clearActors = useCallback(() => {
      const app = appRef.current;
      if (!app) return;
      const existing = app.root.findByName("__actorRoot");
      if (existing) existing.destroy();
      actorRootRef.current = null;
    }, []);

    const animateCameraPath = useCallback((opts: { enabled: boolean; speed?: number; radius?: number; targetY?: number }) => {
      cameraPathRef.current = {
        enabled: opts.enabled,
        speed: opts.speed ?? 1,
        radius: opts.radius ?? 9,
        targetY: opts.targetY ?? 1,
        t: cameraPathRef.current.t,
      };
    }, []);

    const highlightEntity = useCallback((id: string | null) => {
      highlightIdRef.current = id;
    }, []);

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
    }));

    return (
      <div ref={containerRef} className={`relative overflow-hidden bg-[radial-gradient(ellipse_at_center,#1e293b,#020617)] ${className}`}>
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />

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
