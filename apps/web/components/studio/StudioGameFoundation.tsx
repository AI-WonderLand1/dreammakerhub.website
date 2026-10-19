"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Cuboid, Loader2, MapPin, Play, Save, Sparkles, Square, SunMedium, UserRound } from "lucide-react";
import StudioViewport, { type StudioViewportHandle } from "@/components/studio/StudioViewport";
import type { GeneratedScene, GeneratedSceneMaterial, GeneratedSceneObject } from "@/lib/scene/generateScene";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/logger";

type WorldPreset = "training" | "outpost" | "forest";
type ActorKind = "player" | "obstacle" | "prop" | "light" | "model";

type WorldActor = {
  id: string;
  name: string;
  kind: ActorKind;
  position: [number, number, number];
  /** Durable generated-asset reference; signed URLs are resolved on every open. */
  assetId?: string;
};

type ProjectGlbAsset = { id: string; name: string; url: string };
type SavedLevel = { path: string; content: string };

const PRESETS: Record<WorldPreset, { label: string; detail: string; sky: [number, number, number]; ground: [number, number, number]; accent: [number, number, number] }> = {
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
  const materials: GeneratedSceneMaterial[] = [
    { id: "mat-ground", color: style.ground, metalness: 0, roughness: 0.92 },
    ...Object.entries(ACTOR_META).map(([kind, meta]) => ({ id: "mat-" + kind, color: meta.color, metalness: kind === "light" ? 0.1 : 0.25, roughness: 0.58, emissive: kind === "light" ? meta.color : undefined })),
  ];

  const objects: GeneratedSceneObject[] = [
    { id: "ground", name: "Playable Ground", type: "plane", meshUrl: "", position: [0, 0, 0], rotation: [0, 0, 0], scale: [28, 28, 1], material: "mat-ground" },
    ...actors.map((actor) => {
      const meta = ACTOR_META[actor.kind];
      const scale: [number, number, number] = actor.kind === "model" ? [1, 1, 1] : actor.kind === "player" ? [0.8, 1.8, 0.8] : actor.kind === "light" ? [0.45, 0.45, 0.45] : actor.kind === "prop" ? [1.2, 3, 1.2] : [2.4, 2, 1.4];
      return { id: actor.id, name: actor.name, type: meta.primitive, assetId: actor.assetId, meshUrl: actor.assetId ? (modelUrls.get(actor.assetId) ?? "") : "", position: actor.position, rotation: [0, actor.kind === "prop" ? 18 : 0, 0] as [number, number, number], scale, material: "mat-" + actor.kind };
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
  const viewportRef = useRef<StudioViewportHandle>(null);
  const [preset, setPreset] = useState<WorldPreset>("training");
  const [actors, setActors] = useState<WorldActor[]>(() => initialActors("training"));
  const [selectedId, setSelectedId] = useState("player-start");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [projectAssets, setProjectAssets] = useState<ProjectGlbAsset[]>([]);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [savedLevels, setSavedLevels] = useState<SavedLevel[]>([]);
  const [levelsError, setLevelsError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingModel, setGeneratingModel] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<string | null>(null);
  const [meshError, setMeshError] = useState<string | null>(null);

  useEffect(() => {
    setProjectAssets([]);
    setSavedLevels([]);
    setAssetError(null);
    setLevelsError(null);
    if (!projectId || projectId === "default") return;
    const controller = new AbortController();
    setAssetsLoading(true);
    void fetch(`/api/v1/3d/assets?projectId=${encodeURIComponent(projectId)}`, {
      credentials: "include",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load generated models");
      const payload = await response.json() as { assets?: ProjectGlbAsset[] };
      if (!controller.signal.aborted) setProjectAssets(Array.isArray(payload.assets) ? payload.assets : []);
    }).catch(() => {
      if (!controller.signal.aborted) setAssetError("Generated models could not be loaded.");
    }).finally(() => {
      if (!controller.signal.aborted) setAssetsLoading(false);
    });

    void fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
      credentials: "include",
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

  const modelUrls = useMemo(() => new Map(projectAssets.map((asset) => [asset.id, asset.url])), [projectAssets]);
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

  const generateModel = useCallback(async () => {
    const prompt = aiPrompt.trim();
    if (!prompt || generatingModel || projectId === "default") return;
    setGeneratingModel(true);
    setGenerationError(null);
    setGenerationResult(null);
    setMeshError(null);
    try {
      // Use the existing server-side authenticated, credit-metered provider.
      // PlayCanvas renders the resulting GLB; it does not run an AI model.
      const response = await fetch("/api/v1/3d/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId, prompt, format: "glb", addTexture: false }),
      });
      const data = await response.json().catch(() => null) as {
        asset?: { id?: string; url?: string };
        error?: { message?: string };
      } | null;
      if (!response.ok || !data?.asset?.url || !/^3d_[a-zA-Z0-9_-]+$/.test(data.asset.id ?? "")) {
        throw new Error(data?.error?.message || `3D generation failed (HTTP ${response.status}).`);
      }
      const asset: ProjectGlbAsset = {
        id: data.asset.id!,
        name: prompt.slice(0, 70) + ".glb",
        url: data.asset.url,
      };
      setProjectAssets((current) => [asset, ...current.filter((entry) => entry.id !== asset.id)]);
      addGeneratedModel(asset);
      setGenerationResult("GLB saved to this project. Loading its mesh into PlayCanvas…");
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Unable to generate a 3D model.");
    } finally {
      setGeneratingModel(false);
    }
  }, [addGeneratedModel, aiPrompt, generatingModel, projectId]);

  const onMeshStatus = useCallback((detail: { objectId: string; state: "loaded" | "error"; message?: string }) => {
    if (detail.state === "error") {
      setMeshError(detail.message || "PlayCanvas could not load the 3D model.");
    } else {
      setMeshError(null);
      setGenerationResult("3D model rendered in PlayCanvas WebGL2.");
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
          (actor.kind !== "model" || (typeof actor.assetId === "string" && /^3d_[a-zA-Z0-9_-]+$/.test(actor.assetId)));
      }).map((actor) => ({
        id: actor.id,
        name: actor.name,
        kind: actor.kind,
        position: actor.position,
        assetId: actor.assetId,
      }));
      if (!restored.length) throw new Error("Empty level");
      const nextPreset = typeof record.preset === "string" && Object.prototype.hasOwnProperty.call(PRESETS, record.preset) ? record.preset as WorldPreset : "training";
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
    viewportRef.current?.setShowGrid(true);
  }, [scene]);

  useEffect(() => {
    renderWorld();
  }, [renderWorld]);

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
      const response = await fetch("/api/projects/" + encodeURIComponent(projectId) + "/files", {
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
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 p-3">
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
        <Link href={projectId === "default" ? "/dashboard/projects" : `/dashboard/ai-generator?projectId=${encodeURIComponent(projectId)}`}
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
        <StudioViewport ref={viewportRef} onReady={renderWorld} onMeshStatus={onMeshStatus} className="min-h-0 flex-1" showGrid showStats />
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-950/85 px-3 py-1.5 text-[11px] font-mono text-slate-300">
          {running ? "Orbiting scene preview — player controls are not implemented yet." : "PlayCanvas WebGL2 scene · create, render, save"}
        </div>
      </section>

      <aside className="w-72 shrink-0 border-l border-slate-800 bg-slate-950 p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500"><Sparkles size={12} /> Game foundation</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">PlayCanvas WebGL2 renders the world and actual generated GLB meshes. Game logic and playable FPV controls are not enabled yet.</p>
        <section className="mt-4 rounded-lg border border-cyan-900/70 bg-cyan-950/20 p-3" aria-label="AI 3D model generation">
          <label htmlFor="wonderplay-ai-prompt" className="block text-xs font-semibold text-cyan-200">AI model rendering · Text to 3D</label>
          <textarea
            id="wonderplay-ai-prompt"
            className="mt-2 w-full resize-y rounded-md border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder:text-slate-500"
            rows={3}
            maxLength={4000}
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            placeholder="Describe a prop, character or object…"
            disabled={generatingModel}
          />
          <p className="mt-1 text-[10px] leading-4 text-slate-400">
            Uses the configured Hunyuan text-to-3D provider. Geometry only; textures are not requested.
            The current billing route reserves 1 3D credit per attempt. Provider failures after reservation may still consume that credit.
          </p>
          <button type="button" className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => void generateModel()}
            disabled={generatingModel || !aiPrompt.trim() || projectId === "default"}>
            {generatingModel ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generatingModel ? "Generating real GLB…" : "Generate and add to world · 1 credit"}
          </button>
          {projectId === "default" && <p className="mt-2 text-xs text-amber-300">Choose a real project before generating an asset.</p>}
          {generationError && <p role="alert" className="mt-2 text-xs text-red-300">{generationError}</p>}
          {meshError && <p role="alert" className="mt-2 text-xs text-red-300">{meshError}</p>}
          {generationResult && !meshError && <p role="status" className="mt-2 text-xs text-emerald-300">{generationResult}</p>}
        </section>
        {!assetsLoading && actors.some((actor) => actor.assetId && !modelUrls.has(actor.assetId)) &&
          <p role="alert" className="mt-2 text-xs text-amber-300">Some imported models are unavailable in this project. Reopen or restore those assets before publishing.</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {(Object.keys(ACTOR_META) as ActorKind[]).map((kind) => {
            const Icon = ACTOR_META[kind].icon;
            return <button key={kind} onClick={() => addActor(kind)} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-left text-xs text-slate-300 hover:border-cyan-700"><Icon size={14} className="mb-1 text-cyan-400" />{ACTOR_META[kind].label}</button>;
          })}
        </div>
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Selected actor</p>
          <p className="mt-1 text-sm font-semibold text-white">{selected?.name || "None"}</p>
          <p className="mt-1 text-[11px] font-mono text-slate-500">{selected ? "Position " + selected.position.join(", ") : ""}</p>
          <button disabled={!selected || selectedId === "player-start"} onClick={removeSelected} className="mt-3 text-xs text-red-300 disabled:opacity-40">Remove selected</button>
        </div>
        <button onClick={saveLevel} disabled={saving || projectId === "default"} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save game level
        </button>
        {savedPath && <p className="mt-2 break-all text-[10px] font-mono text-emerald-400">Saved {savedPath}</p>}
        {saveError && <p role="alert" className="mt-2 text-[11px] leading-4 text-red-300">{saveError}</p>}
      </aside>
    </div>
  );
}
