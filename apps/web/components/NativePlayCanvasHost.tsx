"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayCanvasHostProps, PlayCanvasNpcPlacement } from "@/components/PlayCanvasEditorHost";
import { logger } from "@/lib/logger";

type Vec3 = [number, number, number];
type SceneObject = {
  id?: string;
  name?: string;
  geometry?: string;
  type?: string;
  meshUrl?: string;
  modelUrl?: string;
  npcId?: string;
  isAiNpc?: boolean;
  material?: { color?: string | number[] };
  position?: number[];
  rotation?: number[];
  scale?: number[];
  transform?: { position?: number[]; rotation?: number[]; scale?: number[] };
};
type Scene = { name?: string; objects?: SceneObject[]; nodes?: any[]; camera?: any; [key: string]: unknown };
type EditorApi = {
  destroy: () => void;
  getScene: () => Promise<Scene>;
  loadScene: (scene: unknown) => void;
  placeNpc: (npc: PlayCanvasNpcPlacement) => void;
  addPrimitive: (kind: Primitive) => void;
  moveObject: (id: string, axis: number, amount: number) => void;
};
const PRIMITIVES = ["box", "sphere", "cylinder", "cone", "capsule", "plane"] as const;
type Primitive = (typeof PRIMITIVES)[number];

function vector(value: unknown, fallback: Vec3): Vec3 {
  if (Array.isArray(value) && value.length >= 3 &&
    value.slice(0, 3).every((n) => typeof n === "number" && Number.isFinite(n))) {
    return [value[0], value[1], value[2]];
  }
  return [...fallback];
}

function rgb(input: string | number[] | undefined): Vec3 {
  if (typeof input === "string" && /^#[a-f0-9]{6}$/i.test(input)) {
    return [1, 3, 5].map((i) => parseInt(input.slice(i, i + 2), 16) / 255) as Vec3;
  }
  return vector(input, [0.5, 0.75, 0.9]);
}

function objectsFromScene(scene: Scene): SceneObject[] {
  if (Array.isArray(scene.objects)) return scene.objects.filter((obj) => obj && typeof obj === "object");
  if (!Array.isArray(scene.nodes)) return [];
  return scene.nodes.filter((node) => node && node.type !== "camera" && node.type !== "light").map((node, index) => ({
    id: String(node.id || "node-" + index),
    name: String(node.name || node.id || "Object " + (index + 1)),
    geometry: node.geometry || node.type,
    meshUrl: node.meshUrl,
    transform: node.transform,
    material: node.material,
  }));
}

function validatedGlbUrl(source: string): string | null {
  try {
    const url = new URL(source, window.location.origin);
    if (url.protocol !== "https:" && url.origin !== window.location.origin) return null;
    return url.pathname.toLowerCase().endsWith(".glb") ? url.href : null;
  } catch {
    return null;
  }
}

/** A local PlayCanvas engine canvas, not a disguised WebGL Studio iframe. */
export default function NativePlayCanvasHost({ sceneId, onReady, onError, onStatus, onSceneChange, onInstance }: PlayCanvasHostProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<EditorApi | null>(null);
  const callbacksRef = useRef({ onReady, onError, onStatus, onSceneChange, onInstance });
  const [failure, setFailure] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [objects, setObjects] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onReady, onError, onStatus, onSceneChange, onInstance };
  }, [onReady, onError, onStatus, onSceneChange, onInstance]);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    const controller = new AbortController();

    async function init() {
      callbacksRef.current.onStatus?.("bootstrapping");
      setFailure(null);
      setWarning(null);
      setObjects([]);
      setSelected(null);
      try {
        const pc: any = await import("playcanvas");
        if (cancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const app = new pc.Application(canvas);
        let destroyed = false;
        let scene: Scene = { name: sceneId, objects: [] };
        const entities: { data: SceneObject; entity: any }[] = [];
        const materials: any[] = [];

        const camera = new pc.Entity("Editor Camera");
        camera.addComponent("camera", { fov: 60, clearColor: new pc.Color(0.04, 0.05, 0.08) });
        app.root.addChild(camera);
        const sun = new pc.Entity("Editor Light");
        sun.addComponent("light", { type: "directional", intensity: 1.8 });
        sun.setEulerAngles(45, 35, 0);
        app.root.addChild(sun);
        app.scene.ambientLight = new pc.Color(0.3, 0.32, 0.38);
        const floor = new pc.Entity("Editor Floor");
        floor.addComponent("render", { type: "plane" });
        floor.setPosition(0, -0.02, 0);
        floor.setLocalScale(40, 1, 40);
        app.root.addChild(floor);

        app.setCanvasFillMode(pc.FILLMODE_NONE);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);
        app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        app.start();

        const resize = () => {
          if (destroyed || !canvas.parentElement) return;
          const rect = canvas.parentElement.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) app.resizeCanvas(Math.round(rect.width), Math.round(rect.height));
        };
        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
        observer?.observe(canvas.parentElement || canvas);
        window.addEventListener("resize", resize);
        resize();

        let orbitYaw = 40, orbitPitch = 28, orbitDistance = 9, dragging = false, lastX = 0, lastY = 0;
        function orbit() {
          const a = orbitYaw * Math.PI / 180, b = orbitPitch * Math.PI / 180;
          camera.setPosition(Math.sin(a) * Math.cos(b) * orbitDistance, Math.sin(b) * orbitDistance, Math.cos(a) * Math.cos(b) * orbitDistance);
          camera.lookAt(0, 0, 0);
        }
        orbit();
        const down = (event: PointerEvent) => {
          dragging = true;
          lastX = event.clientX; lastY = event.clientY;
          canvas.setPointerCapture(event.pointerId);
        };
        const move = (event: PointerEvent) => {
          if (!dragging) return;
          orbitYaw -= (event.clientX - lastX) * 0.3;
          orbitPitch = Math.max(-80, Math.min(80, orbitPitch + (event.clientY - lastY) * 0.3));
          lastX = event.clientX; lastY = event.clientY;
          orbit();
        };
        const up = () => { dragging = false; };
        const wheel = (event: WheelEvent) => {
          event.preventDefault();
          orbitDistance = Math.max(1, Math.min(80, orbitDistance * (event.deltaY > 0 ? 1.1 : 0.9)));
          orbit();
        };
        canvas.addEventListener("pointerdown", down);
        canvas.addEventListener("pointermove", move);
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("wheel", wheel, { passive: false });

        function syncObjects() {
          scene.objects = entities.map(({ data }) => ({ ...data }));
          setObjects(entities.map(({ data }) => ({ id: String(data.id), name: String(data.name) })));
        }

        function changed() {
          if (destroyed) return;
          syncObjects();
          callbacksRef.current.onSceneChange?.({ ...scene });
        }

        function spawn(input: SceneObject) {
          if (destroyed) return;
          const data: SceneObject = {
            ...input,
            id: String(input.id || "object-" + crypto.randomUUID()),
            name: String(input.name || "Object"),
          };
          const entity = new pc.Entity(data.name);
          const transform = data.transform || {};
          entity.setPosition(...vector(data.position || transform.position, [0, 0.5, 0]));
          entity.setEulerAngles(...vector(data.rotation || transform.rotation, [0, 0, 0]));
          entity.setLocalScale(...vector(data.scale || transform.scale, [1, 1, 1]));
          app.root.addChild(entity);
          entities.push({ data, entity });

          const modelUrl = data.meshUrl || data.modelUrl;
          if (modelUrl && !modelUrl.startsWith("primitive:")) {
            const src = validatedGlbUrl(modelUrl);
            if (!src) {
              setWarning("Only HTTPS or local .glb model URLs can be previewed.");
              return;
            }
            const filename = new URL(src).pathname.split("/").pop() || "model.glb";
            app.assets.loadFromUrlAndFilename(src, filename, "container", (error: unknown, asset: any) => {
              if (destroyed || !entity.parent) return;
              if (error || !asset?.resource) {
                logger.warn("[PlayCanvas] GLB loading error", error);
                setWarning("A GLB did not load. Check the asset URL and CORS headers.");
                return;
              }
              entity.addChild(asset.resource.instantiateRenderEntity());
            });
            return;
          }

          const rawGeometry = String(data.geometry || data.type || "box").toLowerCase();
          const kind = rawGeometry === "cube" ? "box" : rawGeometry;
          if (!PRIMITIVES.includes(kind as Primitive)) {
            setWarning("Some scene geometries are not supported by this editor.");
            return;
          }
          entity.addComponent("render", { type: kind });
          if (data.material?.color) {
            const tint = rgb(data.material.color);
            const material = new pc.StandardMaterial();
            material.diffuse = new pc.Color(...tint);
            material.update();
            entity.render.material = material;
            materials.push(material);
          }
        }

        function loadScene(raw: unknown) {
          if (destroyed) return;
          entities.splice(0).forEach(({ entity }) => entity.destroy());
          materials.splice(0).forEach((m) => m.destroy());
          const incoming: Scene = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Scene : {};
          scene = { ...incoming, name: String(incoming.name || sceneId), objects: objectsFromScene(incoming) };
          scene.objects?.forEach(spawn);
          if (incoming.camera?.position) {
            camera.setPosition(...vector(incoming.camera.position, [5, 4, 7]));
            camera.lookAt(...vector(incoming.camera.target, [0, 0, 0]));
          } else orbit();
          syncObjects();
          setSelected(null);
        }

        const api: EditorApi = {
          getScene: async () => ({ ...scene, objects: entities.map(({ data }) => ({ ...data })) }),
          loadScene,
          addPrimitive: (kind) => {
            if (destroyed) return;
            const id = "object-" + crypto.randomUUID();
            spawn({ id, name: kind + " " + (entities.length + 1), geometry: kind, position: [0, 0.5, 0] });
            setSelected(id);
            changed();
          },
          placeNpc: (npc) => {
            if (destroyed || !npc?.id) return;
            const id = "npc-" + npc.id;
            spawn({
              id, name: npc.name || "NPC", npcId: npc.id, isAiNpc: true,
              meshUrl: npc.modelUrl || "/models/npc/RobotExpressive.glb",
              position: npc.position || [0, 0, 0],
              rotation: npc.rotation || [0, 0, 0],
            });
            setSelected(id);
            changed();
          },
          moveObject: (id, axis, amount) => {
            if (destroyed) return;
            const item = entities.find(({ data }) => data.id === id);
            if (!item) return;
            const position = vector(item.data.position || item.data.transform?.position, [0, 0, 0]);
            position[axis] += amount;
            item.data.position = position;
            item.entity.setPosition(...position);
            changed();
          },
          destroy: () => {
            if (destroyed) return;
            destroyed = true;
            observer?.disconnect();
            window.removeEventListener("resize", resize);
            canvas.removeEventListener("pointerdown", down);
            canvas.removeEventListener("pointermove", move);
            canvas.removeEventListener("pointerup", up);
            canvas.removeEventListener("pointercancel", up);
            canvas.removeEventListener("wheel", wheel);
            app.destroy();
          },
        };
        dispose = api.destroy;
        instanceRef.current = api;
        callbacksRef.current.onInstance?.(api);
        callbacksRef.current.onStatus?.("mounting");

        const response = await fetch("/api/scenes/" + encodeURIComponent(sceneId), {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        if (cancelled) return;
        if (response.ok) loadScene(await response.json());
        else if (response.status !== 404) throw new Error("Scene load failed (HTTP " + response.status + ")");

        if (!cancelled) {
          callbacksRef.current.onStatus?.("ready");
          callbacksRef.current.onReady?.();
        }
      } catch (error) {
        if (cancelled) return;
        const reason = error instanceof Error ? error : new Error("PlayCanvas engine failed");
        setFailure(reason.message);
        logger.error("[PlayCanvas] Engine failed", reason);
        callbacksRef.current.onStatus?.("failed");
        callbacksRef.current.onError?.(reason);
        dispose?.();
        instanceRef.current = null;
        callbacksRef.current.onInstance?.(null);
      }
    }

    void init();
    return () => {
      cancelled = true;
      controller.abort();
      dispose?.();
      instanceRef.current = null;
      callbacksRef.current.onInstance?.(null);
    };
  }, [sceneId, attempt]);

  return (
    <div className="relative h-full min-h-[560px] w-full overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="block h-full min-h-[560px] w-full cursor-grab active:cursor-grabbing" style={{ touchAction: "none" }} />
      <div className="absolute left-3 top-3 flex flex-wrap gap-2 rounded-lg border border-white/15 bg-slate-950/90 p-2 text-xs text-white">
        {PRIMITIVES.map((kind) => (
          <button type="button" key={kind}
            className="rounded bg-white/10 px-2 py-1 capitalize hover:bg-cyan-800 disabled:opacity-40"
            disabled={!instanceRef.current || !!failure}
            onClick={() => instanceRef.current?.addPrimitive(kind)}>
            + {kind}
          </button>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 rounded bg-slate-950/85 px-3 py-2 text-xs text-slate-300">
        PlayCanvas Engine · Drag to orbit · Wheel to zoom
      </div>
      {objects.length > 0 && (
        <div className="absolute right-3 top-3 max-h-64 w-44 overflow-auto rounded-lg border border-white/15 bg-slate-950/90 p-2 text-xs text-white">
          <p className="mb-2 font-semibold">Scene objects</p>
          {objects.map((object) => (
            <button type="button" key={object.id} onClick={() => setSelected(object.id)}
              className={"block w-full truncate rounded px-2 py-1 text-left " + (selected === object.id ? "bg-cyan-700" : "hover:bg-white/10")}>
              {object.name}
            </button>
          ))}
          {selected && (
            <div className="mt-3 flex flex-wrap gap-1" aria-label="Move selected object">
              {["X-", "X+", "Y-", "Y+", "Z-", "Z+"].map((label, i) => (
                <button type="button" key={label} className="rounded bg-white/10 px-2 py-1 hover:bg-cyan-800"
                  onClick={() => instanceRef.current?.moveObject(selected, Math.floor(i / 2), i % 2 ? 0.5 : -0.5)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {warning && <p className="absolute bottom-12 left-3 right-3 rounded bg-amber-950/95 p-3 text-xs text-amber-100" role="alert">{warning}</p>}
      {failure && (
        <div className="absolute inset-4 z-10 flex flex-col items-center justify-center rounded-xl bg-red-950/95 p-6 text-center text-white" role="alert">
          <p className="font-semibold">PlayCanvas engine failed to start</p>
          <p className="mt-2 text-sm">{failure}</p>
          <button type="button" className="mt-4 rounded bg-white/15 px-3 py-2 text-sm hover:bg-white/25"
            onClick={() => setAttempt((n) => n + 1)}>Retry engine</button>
        </div>
      )}
    </div>
  );
}
