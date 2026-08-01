"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import type { GeneratedScene } from "@/lib/scene/generateScene";
import { logger } from "@/lib/logger";

export type StudioViewportHandle = {
  renderScene: (scene: GeneratedScene) => void;
  clearScene: () => void;
  injectModel: (gltfUrl: string, assetId?: string) => void;
  getApp: () => any | null;
  getPc: () => any | null;
  renderPanorama: (opts?: { exposure?: number; fov?: number; baseColor?: [number, number, number] }) => void;
  clearPanorama: () => void;
};

export type StudioViewportProps = {
  onSelect?: (selection: { name: string; id: string }) => void;
  className?: string;
  showGizmo?: boolean;
};

const LOOK_AT = [0, 1, 0] as const;

const StudioViewport = forwardRef<StudioViewportHandle, StudioViewportProps>(
  function StudioViewport({ onSelect, className = "", showGizmo = true }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<any>(null);
    const pcRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const selectedEntityRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const onSelectRef = useRef(onSelect);

    useEffect(() => {
      onSelectRef.current = onSelect;
    }, [onSelect]);

    const setupRaycastSelection = useCallback((app: any, cameraEntity: any) => {
      if (!app.mouse) return;

      app.mouse.on(app.constructor.EVENT_MOUSEDOWN ?? 4, (event: any) => {
        if (event.button !== 0) return;

        const screenPoint = cameraEntity.camera.screenToWorld(
          event.x,
          event.y,
          cameraEntity.camera.nearClip,
        );
        const farPoint = cameraEntity.camera.screenToWorld(event.x, event.y, cameraEntity.camera.farClip);

        const from = new app.constructor.Vec3(screenPoint.x, screenPoint.y, screenPoint.z);
        const to = new app.constructor.Vec3(farPoint.x, farPoint.y, farPoint.z);
        const dir = to.clone().sub(from).normalize();

        let result: any = null;
        if (app.systems.rigidbody) {
          result = app.systems.rigidbody.raycastFirst(from, dir, app.systems.rigidbody.maxDistance ?? 1000);
        }
        if (!result) {
          const picked = app.systems.pick ? app.systems.pick.pick(event.x, event.y) : null;
          if (picked) result = { entity: picked };
        }

        if (result?.entity) {
          const entity = result.entity;
          selectedEntityRef.current = entity;
          const name = entity.name || "untitled";
          const id = typeof entity.getGuid === "function" ? entity.getGuid() : name;
          window.dispatchEvent(
            new CustomEvent("onCanvasAssetSelected", {
              detail: { name, id },
            }),
          );
          onSelectRef.current?.({ name, id });
        }
      });
    }, []);

    const setupOrbitControls = useCallback((app: any, camera: any) => {
      let isDragging = false;
      let panning = false;
      let lastX = 0;
      let lastY = 0;
      let dist = 9;
      let az = 40;
      let el = 30;

      const applyCamera = () => {
        const rad = (d: number) => d * 0.0174533;
        const phi = rad(el);
        const theta = rad(az);
        const x = dist * Math.sin(phi) * Math.sin(theta) + LOOK_AT[0];
        const y = dist * Math.cos(phi) + LOOK_AT[1];
        const z = dist * Math.sin(phi) * Math.cos(theta) + LOOK_AT[2];
        camera.setPosition(x, y, z);
        camera.lookAt(LOOK_AT[0], LOOK_AT[1], LOOK_AT[2]);
      };

      app.mouse.on(app.constructor.EVENT_MOUSEDOWN ?? 4, (e: any) => {
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

      app.mouse.on(app.constructor.EVENT_MOUSEUP ?? 5, () => {
        isDragging = false;
        panning = false;
      });

      app.mouse.on(app.constructor.EVENT_MOUSEMOVE ?? 6, (e: any) => {
        const dx = e.x - lastX;
        const dy = e.y - lastY;
        if (isDragging) {
          az -= dx * 0.4;
          el = Math.max(5, Math.min(85, el + dy * 0.4));
        } else if (panning) {
          camera.translateLocal(-dx * 0.03, dy * 0.03, 0);
        }
        lastX = e.x;
        lastY = e.y;
        if (isDragging) applyCamera();
      });

      app.mouse.on(app.constructor.EVENT_MOUSEWHEEL ?? 8, (e: any) => {
        dist = Math.max(2, Math.min(40, dist + e.wheel * 0.3));
        applyCamera();
      });

      app.on("framerender", applyCamera);
      applyCamera();
    }, []);

    const setupGround = useCallback((app: any) => {
      const pc = app.constructor;
      const ground = new pc.Entity("Ground");
      ground.addComponent("render", { type: "plane" });
      ground.setLocalScale(20, 20, 1);
      ground.setPosition(0, -0.1, 0);
      const gm = new pc.StandardMaterial();
      gm.diffuse = new pc.Color(0.12, 0.12, 0.15);
      gm.roughness = 0.95;
      gm.metalness = 0;
      gm.update();
      ground.render.material = gm;
      ground.addComponent("rigidbody", { type: "static" });
      ground.addComponent("collision", { type: "plane" });
      app.root.addChild(ground);
      return ground;
    }, []);

    const setupLights = useCallback((app: any) => {
      const pc = app.constructor;
      const dir = new pc.Entity("DirLight");
      dir.addComponent("light", { type: "directional", color: new pc.Color(1, 1, 1), intensity: 1.1, castShadows: true });
      dir.setEulerAngles(45, 30, 0);
      app.root.addChild(dir);

      const amb = new pc.Entity("AmbLight");
      amb.addComponent("light", { type: "point", color: new pc.Color(0.35, 0.38, 0.5), intensity: 0.7, range: 100 });
      amb.setPosition(4, 8, 4);
      app.root.addChild(amb);
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
        targetEntity.addComponent("collision", {
          type: "box",
          halfExtents: new pc.Vec3(0.5, 0.5, 0.5),
        });
        app.root.addChild(targetEntity);
        selectedEntityRef.current = targetEntity;
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

      const materialCache = new Map<string, any>();
      for (const mat of scene.materials ?? []) {
        const m = new pc.StandardMaterial();
        if (mat.color) m.diffuse = new pc.Color(mat.color[0], mat.color[1], mat.color[2]);
        if (mat.metalness !== undefined) {
          m.metalness = mat.metalness;
          m.useMetalness = true;
        }
        if (mat.roughness !== undefined) m.roughness = mat.roughness;
        if (mat.emissive) m.emissive = new pc.Color(mat.emissive[0], mat.emissive[1], mat.emissive[2]);
        m.update();
        materialCache.set(mat.id, m);
      }

      for (const obj of scene.objects ?? []) {
        const entity = new pc.Entity(obj.name || "object");
        const primitiveTypeMap: Record<string, string> = {
          box: "box",
          sphere: "sphere",
          cylinder: "cylinder",
          plane: "plane",
          capsule: "capsule",
          cone: "cone",
        };
        const renderType = primitiveTypeMap[obj.type] ?? "box";
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
    }, []);

    const clearScene = useCallback(() => {
      const app = appRef.current;
      if (!app) return;
      const existing = app.root.findByName("__sceneRoot");
      if (existing) existing.destroy();
    }, []);

    const injectModel = useCallback((gltfUrl: string, assetId?: string) => {
      window.dispatchEvent(
        new CustomEvent("injectRemoteAiModel", {
          detail: { gltfUrl, assetId },
        }),
      );
    }, []);

    const renderPanorama = useCallback(
      (opts?: { exposure?: number; fov?: number; baseColor?: [number, number, number] }) => {
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc) return;

        const existing = app.root.findByName("__sceneRoot");
        if (existing) existing.destroy();

        const root = new pc.Entity("__sceneRoot");
        app.root.addChild(root);

        const sphere = new pc.Entity("PanoramaSphere");
        sphere.addComponent("render", { type: "sphere" });
        sphere.setLocalScale(60, 60, 60);
        sphere.setPosition(0, 0, 0);

        const mat = new pc.StandardMaterial();
        const [r, g, b] = opts?.baseColor ?? [0.12, 0.3, 0.45];
        mat.diffuse = new pc.Color(r, g, b);
        mat.emissive = new pc.Color(r * 1.3, g * 1.3, b * 1.3);
        mat.emissiveIntensity = 1;
        mat.update();
        sphere.render.material = mat;
        sphere.render.castShadows = false;
        root.addChild(sphere);

        const cam = cameraRef.current;
        if (cam) {
          cam.camera.fov = opts?.fov ?? 90;
          cam.camera.clearColor = new pc.Color(0.03, 0.03, 0.05);
        }

        // Place a small marker so user has a spatial reference
        const marker = new pc.Entity("CenterMarker");
        marker.addComponent("render", { type: "box" });
        marker.setLocalScale(0.1, 0.1, 0.1);
        marker.setPosition(0, 1.6, 0);
        const mm = new pc.StandardMaterial();
        mm.diffuse = new pc.Color(1, 0.5, 0.2);
        mm.emissive = new pc.Color(1, 0.4, 0.1);
        mm.update();
        marker.render.material = mm;
        root.addChild(marker);
      },
      [],
    );

    const clearPanorama = useCallback(() => {
      clearScene();
      const cam = cameraRef.current;
      const app = appRef.current;
      if (cam) {
        cam.camera.fov = 50;
        cam.camera.clearColor = app ? new app.constructor.Color(0.07, 0.07, 0.12) : undefined;
      }
    }, [clearScene]);

    useImperativeHandle(ref, () => ({
      renderScene,
      clearScene,
      injectModel,
      renderPanorama,
      clearPanorama,
      getApp: () => appRef.current,
      getPc: () => pcRef.current,
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
