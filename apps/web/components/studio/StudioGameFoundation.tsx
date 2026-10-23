"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Cuboid, Loader2, MapPin, Play, Save, Sparkles, Square, SunMedium, UserRound, RefreshCw } from "lucide-react";
import StudioViewport, { type StudioViewportHandle, type ToneMappingMode } from "@/components/studio/StudioViewport";
import type { GeneratedScene, GeneratedSceneMaterial, GeneratedSceneObject } from "@/lib/scene/generateScene";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchAuthenticated3D } from "@/lib/3d/browser-3d-fetch";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import { logger } from "@/lib/logger";

type WorldPreset = "blank" | "training" | "outpost" | "forest";
type ActorKind = "player" | "obstacle" | "prop" | "light" | "model";

type WorldActor = {
  id: string;
  name: string;
  kind: ActorKind;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  /** A full GLB environment should not have a placeholder floor drawn over it. */
  environment?: boolean;
  physics?: GeneratedSceneObject["physics"];
  /** Durable generated-asset reference; signed URLs are resolved on every open. */
  assetId?: string;
};

type ProjectGlbAsset = { id: string; name: string; url: string };
type SharedGlbAsset = ProjectGlbAsset & { category: string; path: string; thumbnail: string | null };
type SavedLevel = { path: string; content: string };

const PRESETS: Record<WorldPreset, { label: string; detail: string; sky: [number, number, number]; ground: [number, number, number]; accent: [number, number, number] }> = {
  blank: { label: "Blank Canvas", detail: "Start with an empty ground plane and a player start.", sky: [0.11, 0.13, 0.18], ground: [0.18, 0.2, 0.23], accent: [0.2, 0.7, 1] },
  training: { label: "Training Ground", detail: "Open level with a player spawn and solid cover.", sky: [0.08, 0.12, 0.2], ground: [0.16, 0.18, 0.2], accent: [0.16, 0.65, 1] },
  outpost: { label: "Frontier Outpost", detail: "Small playable sci-fi outpost with structures and lights.", sky: [0.04, 0.07, 0.16], ground: [0.1, 0.12, 0.17], accent: [0.2, 0.85, 0.75] },
  forest: { label: "Forest Trail", detail: "Nature starter world with route markers and tree cover.", sky: [0.23, 0.42, 0.5], ground: [0.1, 0.24, 0.12], accent: [0.3, 0.85, 0.42] },
};

const ACTOR_META: Record<ActorKind, { label: string; icon: typeof UserRound; color: [number, number, number]; primitive: GeneratedSceneObject["type"] }> = {
  player: { label: "Player Start", icon: UserRound, color: [0.16, 0.65, 1], primitive: "capsule" },
  obstacle: { label: "Solid Cover", icon: Cuboid, color: [0.48, 0.42, 0.32], primitive: "box" },
  prop: { label: "Scene Prop", icon: Box, color: [0.45, 0.34, 0.72], primitive: "cylinder" },
  light: { label: "Gameplay Light", icon: SunMedium, color: [1, 0.72, 0.24], primitive: "sphere" },
  model: { label: "Generated 3D Model", icon: Box, color: [0.4, 0.8, 0.9], primitive: "box" },
};

function initialActors(preset: WorldPreset): WorldActor[] {
  if (preset === "blank") return [{ id: "player-start", name: "Player Start", kind: "player", position: [0, 1, 6] }];
  const base: WorldActor[] = [
    { id: "player-start", name: "Player Start", kind: "player", position: [0, 1, 6] },
    { id: "cover-a", name: "Cover A", kind: "obstacle", position: [-3, 1, 0] },
    { id: "cover-b", name: "Cover B", kind: "obstacle", position: [3, 1, -2] },
    { id: "key-light", name: "Key Light", kind: "light", position: [1, 4, 1] },
  ];
  if (preset === "outpost") base.push({ id: "outpost-tower", name: "Outpost Tower", kind: "prop", position: [-5, 2, -5] }, { id: "outpost-gate", name: "Outpost Gate", kind: "obstacle", position: [0, 1.2, -6] });
  if (preset === "forest") base.push({ id: "tree-a", name: "Tree A", kind: "prop", position: [-5, 2.2, -3] }, { id: "tree-b", name: "Tree B", kind: "prop", position: [4, 2.2, -5] });
  return base;
}

function buildWorld(preset: WorldPreset, actors: WorldActor[], modelUrls: ReadonlyMap<string, string>): GeneratedScene {
  const style = PRESETS[preset];
  const hasFullEnvironment = actors.some((actor) => actor.kind === "model" && actor.environment);
  const materials: GeneratedSceneMaterial[] = [
    { id: "mat-ground", color: style.ground, metalness: 0, roughness: 0.92 },
    ...Object.entries(ACTOR_META).map(([kind, meta]) => ({ id: "mat-" + kind, color: meta.color, metalness: kind === "light" ? 0.1 : 0.25, roughness: 0.58, emissive: kind === "light" ? meta.color : undefined })),
  ];

  const objects: GeneratedSceneObject[] = [
    ...(!hasFullEnvironment ? [{ id: "ground", name: "Playable Ground", type: "plane" as const, meshUrl: "", position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [28, 1, 28] as [number, number, number], material: "mat-ground" }] : []),
    ...actors.map((actor) => {
      const meta = ACTOR_META[actor.kind];
      const scale: [number, number, number] = actor.kind === "model" ? [1, 1, 1] : actor.kind === "player" ? [0.8, 1.8, 0.8] : actor.kind === "light" ? [0.45, 0.45, 0.45] : actor.kind === "prop" ? [1.2, 3, 1.2] : [2.4, 2, 1.4];
      return {
        id: actor.id, name: actor.name, type: meta.primitive,
        assetId: actor.assetId,
        frameOnLoad: actor.environment,
        meshUrl: actor.assetId ? (modelUrls.get(actor.assetId) ?? "") : "",
        position: actor.position,
        rotation: actor.rotation ?? [0, actor.kind === "prop" ? 18 : 0, 0] as [number, number, number],
        scale: actor.scale ?? scale, material: "mat-" + actor.kind,
        physics: actor.physics ?? (actor.kind === "model" ? { type: "static" as const } : actor.kind === "prop"
          ? { type: "dynamic" as const, mass: 2, friction: 0.7, restitution: 0.1 }
          : { type: "static" as const }),
      };
    }),
  ];

  return {
    name: PRESETS[preset].label,
    description: PRESETS[preset].detail,
    objects,
    materials,
    lights: [
      { id: "sun", type: "directional", color: [1, 0.96, 0.84], intensity: 1.35, direction: [-0.6, -1, -0.3] },
      { id: "world-accent", type: "point", color: style.accent, intensity: 2.4, position: [0, 5, -3] },
      ...actors.filter((actor) => actor.kind === "light").map((actor) => ({ id: "light-" + actor.id, type: "point" as const, color: ACTOR_META.light.color, intensity: 2.6, position: actor.position })),
    ],
    camera: { position: [0, 4.4, 12], target: [0, 1, 0], fov: 60 },
    sky: { type: "color", color: style.sky },
  };
}

export default function StudioGameFoundation() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId")?.trim() || "default";
  const requestedLibraryAsset = searchParams?.get("libraryAsset")?.trim() || "";
  const viewportRef = useRef<StudioViewportHandle>(null);
  const openedLibraryRef = useRef<string | null>(null);
  const [preset, setPreset] = useState<WorldPreset>("blank");
  const [actors, setActors] = useState<WorldActor[]>(() => initialActors("blank"));
  const [selectedId, setSelectedId] = useState("player-start");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [projectAssets, setProjectAssets] = useState<ProjectGlbAsset[]>([]);
  const [sharedAssets, setSharedAssets] = useState<SharedGlbAsset[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryRevision, setLibraryRevision] = useState(0);
  const [toneMapping, setToneMapping] = useState<ToneMappingMode>("ACES");
  const [exposure, setExposure] = useState(1);
  const [shadows, setShadows] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [savedLevels, setSavedLevels] = useState<SavedLevel[]>([]);
  const [levelsError, setLevelsError] = useState<string | null>(null);
  const [meshError, setMeshError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLibraryLoading(true);
    setLibraryError(null);
    void fetch("/api/wonderplay/library", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Sign in to use your shared 3D asset library.");
        if (!response.ok) throw new Error(`Shared 3D library unavailable (HTTP ${response.status}).`);
        const payload = await response.json() as { assets?: SharedGlbAsset[] };
        if (!controller.signal.aborted) setSharedAssets(Array.isArray(payload.assets) ? payload.assets : []);
      }).catch((error) => {
        if (!controller.signal.aborted) setLibraryError(error instanceof Error ? error.message : "Shared models could not be loaded.");
      }).finally(() => { if (!controller.signal.aborted) setLibraryLoading(false); });
    return () => controller.abort();
  }, [libraryRevision]);

  useEffect(() => {
    setProjectAssets([]);
    setSavedLevels([]);
    setAssetError(null);
    setLevelsError(null);
    if (!projectId || projectId === "default") return;
    const controller = new AbortController();
    setAssetsLoading(true);
    void fetchAuthenticated3D(`/api/v1/3d/assets?projectId=${encodeURIComponent(projectId)}`, {
      signal: controller.signal,
    }).then(async (response) => {
      if (response.status === 401) throw new Error("Sign in to load project models.");
      if (!response.ok) throw new Error(`Generated model library unavailable (HTTP ${response.status}).`);
      const payload = await response.json() as { assets?: ProjectGlbAsset[] };
      if (!controller.signal.aborted) setProjectAssets(Array.isArray(payload.assets) ? payload.assets : []);
    }).catch((error) => {
      if (!controller.signal.aborted) setAssetError(error instanceof Error ? error.message : "Generated models could not be loaded.");
    }).finally(() => {
      if (!controller.signal.aborted) setAssetsLoading(false);
    });

    void fetchAuthenticatedProject(`/api/projects/${encodeURIComponent(projectId)}/files`, {
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load saved levels");
      const payload = await response.json() as { files?: Record<string, string> };
      if (!controller.signal.aborted) {
        setSavedLevels(Object.entries(payload.files ?? {})
          .filter(([path]) => path.startsWith("levels/") && path.endsWith(".json"))
          .map(([path, content]) => ({ path, content })));
      }
    }).catch(() => {
      if (!controller.signal.aborted) setLevelsError("Saved levels could not be loaded.");
    });
    return () => controller.abort();
  }, [projectId]);

  const modelUrls = useMemo(() => new Map([
    ...projectAssets.map((asset): [string, string] => [asset.id, asset.url]),
    ...sharedAssets.map((asset): [string, string] => [asset.id, asset.url]),
  ]), [projectAssets, sharedAssets]);
  const scene = useMemo(() => buildWorld(preset, actors, modelUrls), [actors, preset, modelUrls]);

  const addGeneratedModel = useCallback((asset: ProjectGlbAsset) => {
    const id = `imported-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setActors((current) => [...current, {
      id,
      name: asset.name.replace(/[.]glb$/i, ""),
      kind: "model",
      assetId: asset.id,
      position: [0, 1, -2],
    }]);
    setSelectedId(id);
  }, []);

  const addSharedModel = useCallback((asset: SharedGlbAsset, openAsEnvironment: boolean) => {
    const id = `library-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const actor: WorldActor = {
      id, name: asset.name, kind: "model", assetId: asset.id,
      environment: openAsEnvironment,
      position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
    };
    if (openAsEnvironment) {
      setPreset("blank");
      setActors([actor]);
      setRunning(false);
    } else {
      setActors((current) => [...current, actor]);
    }
    setSelectedId(id);
    setSavedPath(null);
    setMeshError(null);
  }, []);

  useEffect(() => {
    if (!requestedLibraryAsset || openedLibraryRef.current === requestedLibraryAsset) return;
    const savedModel = sharedAssets.find((asset) => asset.id === requestedLibraryAsset);
    if (!savedModel) return;
    openedLibraryRef.current = requestedLibraryAsset;
    addSharedModel(savedModel, true);
  }, [requestedLibraryAsset, sharedAssets, addSharedModel]);

  const onMeshStatus = useCallback((detail: { objectId: string; state: "loaded" | "error"; message?: string }) => {
    if (detail.state === "error") {
      setMeshError(detail.message || "PlayCanvas could not load the 3D model.");
    } else {
      setMeshError(null);

    }
  }, []);

  const openSavedLevel = useCallback((level: SavedLevel) => {
    try {
      const payload: unknown = JSON.parse(level.content);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid level");
      const record = payload as { preset?: unknown; actors?: unknown };
      if (!Array.isArray(record.actors)) throw new Error("Invalid actors");
      const restored: WorldActor[] = record.actors.filter((value): value is WorldActor => {
        if (!value || typeof value !== "object") return false;
        const actor = value as Partial<WorldActor>;
        return typeof actor.id === "string" && typeof actor.name === "string" &&
          typeof actor.kind === "string" && Object.prototype.hasOwnProperty.call(ACTOR_META, actor.kind) &&
          Array.isArray(actor.position) && actor.position.length === 3 &&
          actor.position.every((n) => typeof n === "number" && Number.isFinite(n)) &&
          (actor.kind !== "model" || (typeof actor.assetId === "string" &&
            (/^3d_[a-zA-Z0-9_-]+$/.test(actor.assetId) ||
              (actor.assetId.startsWith("storage:") && actor.assetId.length <= 300))));
      }).map((actor) => ({
        id: actor.id,
        name: actor.name,
        kind: actor.kind,
        position: actor.position,
        assetId: actor.assetId,
        rotation: Array.isArray(actor.rotation) && actor.rotation.length === 3 && actor.rotation.every(Number.isFinite)
          ? actor.rotation : undefined,
        scale: Array.isArray(actor.scale) && actor.scale.length === 3 && actor.scale.every((n) => Number.isFinite(n) && n > 0)
          ? actor.scale : undefined,
        environment: actor.environment === true,
        physics: actor.physics && ["static", "dynamic", "kinematic"].includes(actor.physics.type)
          ? {
              type: actor.physics.type,
              mass: typeof actor.physics.mass === "number" && Number.isFinite(actor.physics.mass) && actor.physics.mass > 0 ? actor.physics.mass : undefined,
              friction: typeof actor.physics.friction === "number" && Number.isFinite(actor.physics.friction) && actor.physics.friction >= 0 ? actor.physics.friction : undefined,
              restitution: typeof actor.physics.restitution === "number" && Number.isFinite(actor.physics.restitution) && actor.physics.restitution >= 0 ? actor.physics.restitution : undefined,
            }
          : undefined,
      }));
      if (!restored.length) throw new Error("Empty level");
      const nextPreset = typeof record.preset === "string" && Object.prototype.hasOwnProperty.call(PRESETS, record.preset) ? record.preset as WorldPreset : "blank";
      setPreset(nextPreset);
      setActors(restored);
      setSelectedId(restored[0].id);
      setSaveError(null);
      setSavedPath(level.path);
    } catch {
      setSaveError("Could not open this level. Its saved data may be invalid.");
    }
  }, []);

  const renderWorld = useCallback(() => {
    viewportRef.current?.renderScene(scene);
  }, [scene]);

  const applyViewportSettings = useCallback(() => {
    viewportRef.current?.setShowGrid(showGrid && !actors.some((actor) => actor.environment));
    viewportRef.current?.setToneMapping(toneMapping);
    viewportRef.current?.setExposure(exposure);
    viewportRef.current?.setShadows(shadows);
    viewportRef.current?.setWireframe(wireframe);
  }, [showGrid, actors, toneMapping, exposure, shadows, wireframe]);

  useEffect(() => {
    renderWorld();
  }, [renderWorld]);

  useEffect(() => {
    applyViewportSettings();
  }, [applyViewportSettings, scene]);

  const selectPreset = useCallback((next: WorldPreset) => {
    setPreset(next);
    setActors(initialActors(next));
    setSelectedId("player-start");
    viewportRef.current?.animateCameraPath({ enabled: false });
    setRunning(false);
    setSavedPath(null);
    setSaveError(null);
  }, []);

  const addActor = useCallback((kind: ActorKind) => {
    const count = actors.filter((actor) => actor.kind === kind).length + 1;
    const offset = actors.length * 1.7;
    const actor: WorldActor = {
      id: kind + "-" + Date.now().toString(36),
      name: ACTOR_META[kind].label + " " + count,
      kind,
      position: [((offset % 10) - 5), kind === "light" ? 4 : kind === "prop" ? 2 : 1, -2 - Math.floor(offset / 5) * 2],
    };
    setActors((current) => [...current, actor]);
    setSelectedId(actor.id);
  }, [actors]);

  const removeSelected = useCallback(() => {
    if (selectedId === "player-start") return;
    setActors((current) => current.filter((actor) => actor.id !== selectedId));
    setSelectedId("player-start");
  }, [selectedId]);

  const updateSelectedTransform = useCallback((field: "position" | "rotation" | "scale", axis: number, raw: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value) || (field === "scale" && value <= 0)) return;
    setActors((current) => current.map((actor) => {
      if (actor.id !== selectedId) return actor;
      const vector: [number, number, number] = [...(actor[field] ?? (field === "scale" ? [1, 1, 1] : [0, 0, 0]))];
      vector[axis] = value;
      return { ...actor, [field]: vector };
    }));
    setSavedPath(null);
  }, [selectedId]);

  const updateSelectedPhysics = useCallback((field: "type" | "mass" | "friction" | "restitution", value: string) => {
    setActors((current) => current.map((actor) => {
      if (actor.id !== selectedId) return actor;
      const defaults: NonNullable<WorldActor["physics"]> = actor.kind === "prop"
        ? { type: "dynamic", mass: 2, friction: 0.7, restitution: 0.1 }
        : { type: "static", mass: 1, friction: 0.6, restitution: 0.1 };
      const physics = { ...defaults, ...actor.physics };
      if (field === "type") {
        if (!["static", "dynamic", "kinematic"].includes(value)) return actor;
        return { ...actor, physics: { ...physics, type: value as "static" | "dynamic" | "kinematic" } };
      }
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || (field === "mass" && number === 0)) return actor;
      return { ...actor, physics: { ...physics, [field]: number } };
    }));
    setSavedPath(null);
  }, [selectedId]);

  const togglePreview = useCallback(() => {
    setRunning((current) => {
      const next = !current;
      viewportRef.current?.animateCameraPath({ enabled: next, speed: 1.1, radius: 11, targetY: 2, lookAt: [0, 1, 0], ease: true });
      return next;
    });
  }, []);

  const saveLevel = useCallback(async () => {
    setSaving(true);
    setSavedPath(null);
    setSaveError(null);
    try {
      const slug = preset + "_game_level";
      const path = "levels/" + slug + "_" + Date.now().toString(36) + ".json";
      const durableScene = {
        ...scene,
        // Signed URLs expire. Restore GLB links by asset ID when reopening.
        objects: scene.objects.map((object) => ({ ...object, meshUrl: "" })),
      };
      const content = JSON.stringify({
        version: 2, type: "wonderplay-level", playerStartId: "player-start",
        preset, scene: durableScene, actors,
      }, null, 2);
      const response = await fetchAuthenticatedProject("/api/projects/" + encodeURIComponent(projectId) + "/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: { [path]: content } }),
      });
      if (!response.ok) throw new Error("Could not save level");
      setSavedPath(path);
      setSavedLevels((current) => [{ path, content }, ...current]);
    } catch (error) {
      logger.error("Save WonderPlay level error:", error);
      setSaveError("Level could not be saved. Check the selected project and try again.");
    } finally {
      setSaving(false);
    }
  }, [actors, preset, projectId, scene]);

  const selected = actors.find((actor) => actor.id === selectedId);
  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-950 p-3">
        <div className="mb-4 rounded-lg border border-cyan-800/60 bg-cyan-950/20 p-2" aria-label="Your saved 3D models">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-200">Saved 3D library</p>
            <button type="button" onClick={() => setLibraryRevision((n) => n + 1)} title="Refresh shared library" aria-label="Refresh shared 3D library"><RefreshCw size={13} className={libraryLoading ? "animate-spin" : ""}/></button>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-slate-400">Open a real GLB environment, or add a GLB as a prop. Its original mesh materials are retained.</p>
          {libraryError && <p role="alert" className="mt-2 text-[10px] text-amber-300">{libraryError}</p>}
          {libraryLoading && <p role="status" className="mt-2 text-[10px] text-slate-300">Loading saved models…</p>}
          {!libraryLoading && !libraryError && sharedAssets.length === 0 && <p className="mt-2 text-[10px] text-slate-400">No shared GLB models are available.</p>}
          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
            {sharedAssets.map((asset) => (
              <div key={asset.id} className="rounded border border-slate-700/70 bg-slate-900/70 p-2">
                <span className="block truncate text-xs text-white" title={asset.path}>{asset.name}</span>
                <span className="block truncate text-[9px] text-slate-500">{asset.category}</span>
                <div className="mt-1 flex gap-1">
                  <button type="button" onClick={() => addSharedModel(asset, true)} className="flex-1 rounded bg-cyan-800 px-1.5 py-1 text-[10px] font-semibold text-white hover:bg-cyan-700">Open scene</button>
                  <button type="button" onClick={() => addSharedModel(asset, false)} className="flex-1 rounded border border-slate-600 px-1.5 py-1 text-[10px] text-slate-200 hover:bg-slate-700">Add prop</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">World presets</p>
        <div className="space-y-1">
          {(Object.keys(PRESETS) as WorldPreset[]).map((id) => (
            <button key={id} onClick={() => selectPreset(id)} className={"w-full rounded-lg border p-2 text-left " + (preset === id ? "border-cyan-500/60 bg-cyan-950/30 text-white" : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700")}>
              <span className="block text-xs font-bold">{PRESETS[id].label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{PRESETS[id].detail}</span>
            </button>
          ))}
        </div>
        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Generated 3D models</p>
        <p className="mb-2 text-[10px] text-slate-500">Select a project and generate a GLB to place it in this world.</p>
        <Link href={projectId === "default" ? "/dashboard/projects" : `/dashboard/3dhub?step=pick&pickTool=3d&projectId=${encodeURIComponent(projectId)}`}
          className="mb-2 block rounded border border-cyan-800 px-2 py-2 text-center text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40">
          {projectId === "default" ? "Choose a project" : "Generate GLB for this project"}
        </Link>
        {assetsLoading && <p className="text-xs text-slate-400">Loading models…</p>}
        {assetError && <p role="alert" className="text-xs text-red-300">{assetError}</p>}
        {!assetsLoading && !assetError && projectAssets.length === 0 &&
          <p className="text-xs text-slate-500">No generated GLBs saved to this project yet.</p>}
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {projectAssets.map((asset) => (
            <button type="button" key={asset.id} onClick={() => addGeneratedModel(asset)}
              className="flex w-full items-center gap-2 rounded border border-slate-800 bg-slate-900 p-2 text-left text-xs text-cyan-200 hover:border-cyan-600"
              title="Place this model in the world">
              <Box size={14} /> <span className="min-w-0 flex-1 truncate">{asset.name}</span><span>+ Add</span>
            </button>
          ))}
        </div>
        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Saved levels</p>
        {levelsError && <p role="alert" className="text-xs text-red-300">{levelsError}</p>}
        <div className="max-h-28 space-y-1 overflow-y-auto">
          {savedLevels.map((level) => (
            <button type="button" key={level.path} onClick={() => openSavedLevel(level)}
              className="w-full truncate rounded border border-slate-800 bg-slate-900 p-2 text-left text-xs text-slate-300 hover:border-cyan-600"
              title={level.path}>Open {level.path.split("/").pop()}</button>
          ))}
        </div>
        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">World outliner</p>
        <div className="space-y-1">
          {actors.map((actor) => {
            const Icon = ACTOR_META[actor.kind].icon;
            return <button key={actor.id} onClick={() => setSelectedId(actor.id)} className={"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs " + (selectedId === actor.id ? "bg-blue-600/30 text-white" : "text-slate-400 hover:bg-slate-900")}>
              <Icon size={13} className="text-cyan-400" /> <span className="truncate">{actor.name}</span>
            </button>;
          })}
        </div>
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col bg-slate-900">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-800 px-3">
          <span className="flex items-center gap-2 text-xs font-mono text-slate-400"><MapPin size={14} className="text-cyan-400" /> PlayCanvas · WebGL2 · {scene.name}</span>
          <div className="flex items-center gap-2">
            <button onClick={togglePreview} className={"flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold " + (running ? "bg-red-600/80 text-white" : "bg-emerald-600 text-white hover:bg-emerald-500")}>
              {running ? <Square size={12} /> : <Play size={12} />} {running ? "Stop Preview" : "Run World"}
            </button>
          </div>
        </header>
        <StudioViewport ref={viewportRef} onReady={() => { renderWorld(); applyViewportSettings(); }} onMeshStatus={onMeshStatus}
          onSelect={(selection) => {
            const actor = actors.find((item) => item.name === selection.name);
            if (actor) setSelectedId(actor.id);
          }}
          className="min-h-0 flex-1" showGrid={showGrid} showStats />
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-950/85 px-3 py-1.5 text-[11px] font-mono text-slate-300">
          {running ? "Orbiting scene preview — player controls are not implemented yet." : "PlayCanvas real-time viewport · orbit / zoom / pan"}
        </div>
      </section>

      <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950 p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500"><Sparkles size={12} /> World &amp; scene inspector</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">PlayCanvas renders actual GLB meshes with their embedded materials. Game logic and playable FPV controls are not enabled yet.</p>
        <section className="mt-4 rounded-lg border border-cyan-900/70 bg-cyan-950/20 p-3" aria-label="3D asset library">
          <p className="text-xs font-semibold text-cyan-200">Use your existing 3D assets</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Open a saved public GLB from the shared library, or generate a new GLB in 3D Studio. Imported GLBs retain their authored materials; primitive world presets are only starter geometry.
          </p>
          <Link href={projectId === "default" ? "/dashboard/projects" : `/dashboard/3dhub?step=pick&pickTool=3d&projectId=${encodeURIComponent(projectId)}`}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-600">
            <Sparkles size={14} /> {projectId === "default" ? "Choose a project" : "Open 3D Studio to generate"}
          </Link>
          {meshError && <p role="alert" className="mt-2 text-xs text-red-300">{meshError}</p>}
        </section>
        {!assetsLoading && !libraryLoading && actors.some((actor) => actor.assetId && !modelUrls.has(actor.assetId)) &&
          <p role="alert" className="mt-2 text-xs text-amber-300">Some imported models are unavailable in this project. Reopen or restore those assets before publishing.</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {(Object.keys(ACTOR_META) as ActorKind[]).filter((kind) => kind !== "model").map((kind) => {
            const Icon = ACTOR_META[kind].icon;
            return <button key={kind} onClick={() => addActor(kind)} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-left text-xs text-slate-300 hover:border-cyan-700"><Icon size={14} className="mb-1 text-cyan-400" />{ACTOR_META[kind].label}</button>;
          })}
        </div>
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Selected actor</p>
          <p className="mt-1 text-sm font-semibold text-white">{selected?.name || "None"}</p>
          {selected && (
            <div className="mt-3">
              {(["position", "rotation", "scale"] as const).map((field) => (
                <div key={field} className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transform · {field}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["X", "Y", "Z"] as const).map((axis, index) => (
                      <label key={axis} className="text-[10px] text-slate-400">
                        {axis}
                        <input aria-label={`${axis} ${field}`} type="number" step={field === "rotation" ? "5" : "0.1"}
                          value={(selected[field] ?? (field === "scale" ? [1, 1, 1] : [0, 0, 0]))[index]}
                          onChange={(event) => updateSelectedTransform(field, index, event.target.value)}
                          className="mt-1 block w-full min-w-0 rounded border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"/>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-4 border-t border-slate-800 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Physics · rigid body</p>
                <label className="mt-2 block text-[10px] text-slate-400">Body type
                  <select aria-label="Rigid body type" value={selected.physics?.type ?? (selected.kind === "prop" ? "dynamic" : "static")}
                    onChange={(event) => updateSelectedPhysics("type", event.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white">
                    <option value="static">Static (fixed)</option>
                    <option value="dynamic">Dynamic (gravity)</option>
                    <option value="kinematic">Kinematic (scripted)</option>
                  </select>
                </label>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {(["mass", "friction", "restitution"] as const).map((field) => (
                    <label key={field} className="text-[10px] text-slate-400">{field === "restitution" ? "Bounce" : field === "friction" ? "Friction" : "Mass"}
                      <input aria-label={`Physics ${field}`} type="number" min={field === "mass" ? "0.01" : "0"} step="0.1"
                        value={selected.physics?.[field] ?? (field === "mass" ? (selected.kind === "prop" ? 2 : 1) : field === "friction" ? 0.6 : 0.1)}
                        onChange={(event) => updateSelectedPhysics(field, event.target.value)}
                        className="mt-1 block w-full min-w-0 rounded border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"/>
                    </label>
                  ))}
                </div>
                {selected.kind === "model" && <p className="mt-2 text-[10px] leading-4 text-amber-300">Imported GLBs currently use an approximate box collider. Detailed mesh colliders and joints are not enabled.</p>}
              </div>
            </div>
          )}
          <button disabled={!selected || selectedId === "player-start"} onClick={removeSelected} className="mt-3 text-xs text-red-300 disabled:opacity-40">Remove selected</button>
        </div>
        <fieldset className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <legend className="px-1 text-[10px] font-bold uppercase tracking-widest text-cyan-200">Real-time graphics</legend>
          <label className="block text-[11px] text-slate-300">Tone mapping
            <select aria-label="Tone mapping" value={toneMapping} onChange={(event) => setToneMapping(event.target.value as ToneMappingMode)} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-white">
              {(["ACES", "Neutral", "Filmic", "HEJL", "Linear"] as const).map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </label>
          <label className="block text-[11px] text-slate-300">Exposure · {exposure.toFixed(2)}
            <input aria-label="Scene exposure" className="block w-full accent-cyan-500" type="range" min="0.3" max="2.5" step="0.05" value={exposure} onChange={(event) => setExposure(Number(event.target.value))}/>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={shadows} onChange={(event) => setShadows(event.target.checked)}/> Cast shadows</label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)}/> Editor grid</label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)}/> Wireframe view</label>
          <p className="text-[10px] leading-4 text-slate-500">These controls change the live renderer. Higher quality effects depend on scene materials and your device.</p>
        </fieldset>
        <button onClick={saveLevel} disabled={saving || projectId === "default"} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save game level
        </button>
        {savedPath && <p className="mt-2 break-all text-[10px] font-mono text-emerald-400">Saved {savedPath}</p>}
        {saveError && <p role="alert" className="mt-2 text-[11px] leading-4 text-red-300">{saveError}</p>}
      </aside>
    </div>
  );
}
