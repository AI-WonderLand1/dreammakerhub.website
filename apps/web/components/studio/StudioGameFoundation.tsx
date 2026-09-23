"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Cuboid, Loader2, MapPin, Play, Save, Sparkles, Square, SunMedium, UserRound } from "lucide-react";
import StudioViewport, { type StudioViewportHandle } from "@/components/studio/StudioViewport";
import type { GeneratedScene, GeneratedSceneMaterial, GeneratedSceneObject } from "@/lib/scene/generateScene";
import { useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

type WorldPreset = "training" | "outpost" | "forest";
type ActorKind = "player" | "obstacle" | "prop" | "light";

type WorldActor = {
  id: string;
  name: string;
  kind: ActorKind;
  position: [number, number, number];
};

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

function buildWorld(preset: WorldPreset, actors: WorldActor[]): GeneratedScene {
  const style = PRESETS[preset];
  const materials: GeneratedSceneMaterial[] = [
    { id: "mat-ground", color: style.ground, metalness: 0, roughness: 0.92 },
    ...Object.entries(ACTOR_META).map(([kind, meta]) => ({ id: "mat-" + kind, color: meta.color, metalness: kind === "light" ? 0.1 : 0.25, roughness: 0.58, emissive: kind === "light" ? meta.color : undefined })),
  ];

  const objects: GeneratedSceneObject[] = [
    { id: "ground", name: "Playable Ground", type: "plane", meshUrl: "", position: [0, 0, 0], rotation: [0, 0, 0], scale: [28, 28, 1], material: "mat-ground" },
    ...actors.map((actor) => {
      const meta = ACTOR_META[actor.kind];
      const scale: [number, number, number] = actor.kind === "player" ? [0.8, 1.8, 0.8] : actor.kind === "light" ? [0.45, 0.45, 0.45] : actor.kind === "prop" ? [1.2, 3, 1.2] : [2.4, 2, 1.4];
      return { id: actor.id, name: actor.name, type: meta.primitive, meshUrl: "", position: actor.position, rotation: [0, actor.kind === "prop" ? 18 : 0, 0], scale, material: "mat-" + actor.kind };
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

  const scene = useMemo(() => buildWorld(preset, actors), [actors, preset]);

  useEffect(() => {
    viewportRef.current?.renderScene(scene);
    viewportRef.current?.setShowGrid(true);
  }, [scene]);

  const selectPreset = useCallback((next: WorldPreset) => {
    setPreset(next);
    setActors(initialActors(next));
    setSelectedId("player-start");
    setRunning(false);
    setSavedPath(null);
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
    try {
      const slug = preset + "_game_level";
      const path = "levels/" + slug + "_" + Date.now().toString(36) + ".json";
      const response = await fetch("/api/projects/" + encodeURIComponent(projectId) + "/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: { [path]: JSON.stringify({ version: 1, type: "wonderplay-level", playerStartId: "player-start", scene, actors }, null, 2) } }),
      });
      if (!response.ok) throw new Error("Could not save level");
      setSavedPath(path);
    } catch (error) {
      logger.error("Save WonderPlay level error:", error);
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
          <span className="flex items-center gap-2 text-xs font-mono text-slate-400"><MapPin size={14} className="text-cyan-400" /> {scene.name}</span>
          <div className="flex items-center gap-2">
            <button onClick={togglePreview} className={"flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold " + (running ? "bg-red-600/80 text-white" : "bg-emerald-600 text-white hover:bg-emerald-500")}>
              {running ? <Square size={12} /> : <Play size={12} />} {running ? "Stop Preview" : "Run World"}
            </button>
          </div>
        </header>
        <StudioViewport ref={viewportRef} className="min-h-0 flex-1" showGrid showStats />
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-950/85 px-3 py-1.5 text-[11px] font-mono text-slate-300">
          {running ? "World preview running — game scene is live. FPV controller and nodes come next." : "Build world → save level → run preview"}
        </div>
      </section>

      <aside className="w-72 shrink-0 border-l border-slate-800 bg-slate-950 p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500"><Sparkles size={12} /> Game foundation</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">This creates a real, saved WonderPlay level with a player start, physical scene objects, lights, and a running preview. Blueprint-style nodes are intentionally the next layer.</p>
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
        <button onClick={saveLevel} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save game level
        </button>
        {savedPath && <p className="mt-2 break-all text-[10px] font-mono text-emerald-400">Saved {savedPath}</p>}
      </aside>
    </div>
  );
}
