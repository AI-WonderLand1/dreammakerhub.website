"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Users, Cpu, Box, Zap, Grid3x3, Loader2 } from "lucide-react";
import StudioViewport, { type StudioViewportHandle } from "@/components/studio/StudioViewport";
import type { GeneratedScene, GeneratedSceneMaterial, GeneratedSceneObject } from "@/lib/scene/generateScene";
import { useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

const ACTORS = ["System_Player_Rig", "Dynamic_Enemy_AI", "Physics_Item_Crate", "Trigger_Zone_Volume"];

type ActorNode = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
};

const ACTOR_COLORS: Record<string, [number, number, number]> = {
  System_Player_Rig: [0.2, 0.6, 1],
  Dynamic_Enemy_AI: [1, 0.3, 0.3],
  Physics_Item_Crate: [0.7, 0.5, 0.2],
  Trigger_Zone_Volume: [0.3, 1, 0.6],
};

const ACTOR_PRIMITIVE: Record<string, GeneratedSceneObject["type"]> = {
  System_Player_Rig: "box",
  Dynamic_Enemy_AI: "cone",
  Physics_Item_Crate: "box",
  Trigger_Zone_Volume: "sphere",
};

export default function StudioGameBuilder() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId")?.trim() || "default";

  const viewportRef = useRef<StudioViewportHandle>(null);
  const [actors, setActors] = useState<ActorNode[]>([]);
  const [behaviorPrompt, setBehaviorPrompt] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [gridSize, setGridSize] = useState(12);

  // Render placed actors into the real 3D viewport whenever the list changes
  useEffect(() => {
    viewportRef.current?.clearActors();
    for (const actor of actors) {
      viewportRef.current?.placeActor({ name: actor.name, type: actor.type, x: actor.x, y: actor.y });
    }
  }, [actors]);

  const addActor = useCallback(
    (type: string) => {
      const idx = actors.length + 1;
      const base = type.replace("System_", "").replace("Physics_", "").replace("Dynamic_", "").replace("Trigger_", "").replace("_", " ");
      const name = `${base} ${idx}`;
      setActors((prev) => [
        ...prev,
        { id: `a${Date.now()}`, name, type, x: (idx * 2) % gridSize, y: Math.floor((idx * 2) / gridSize) % gridSize },
      ]);
    },
    [actors.length, gridSize],
  );

  const removeActor = useCallback((id: string) => {
    setActors((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleTestPlay = useCallback(() => {
    setTesting((prev) => {
      viewportRef.current?.animateCameraPath({ enabled: !prev, speed: 1, radius: 12, targetY: 2 });
      return !prev;
    });
  }, []);

  const buildScene = useCallback((): GeneratedScene => {
    const materials: GeneratedSceneMaterial[] = actors.map((a) => ({
      id: `mat-${a.id}`,
      color: ACTOR_COLORS[a.type] ?? [0.5, 0.5, 0.8],
      metalness: a.type === "Physics_Item_Crate" ? 0.3 : 0.1,
      roughness: 0.6,
      emissive: [0, 0, 0],
    }));

    const objects: GeneratedSceneObject[] = actors.map((a) => {
      const worldX = (a.x / gridSize) * 20 - 10;
      const worldZ = (a.y / gridSize) * 20 - 10;
      return {
        id: a.id,
        name: a.name,
        type: ACTOR_PRIMITIVE[a.type] ?? "box",
        meshUrl: "",
        position: [worldX, a.type === "Physics_Item_Crate" ? 0.5 : 0.8, worldZ],
        rotation: [0, 0, 0],
        scale: [0.8, 0.8, 0.8],
        material: `mat-${a.id}`,
      };
    });

    return {
      name: "AI Game Level",
      description: `Procedural game level: ${actors.map((a) => a.name).join(", ") || "empty"}. Behavior: ${behaviorPrompt || "none"}`,
      objects,
      materials,
      lights: [
        { id: "light-key", type: "directional", color: [1, 1, 1], intensity: 1.2, direction: [-1, -1, -0.3] },
        { id: "light-rim", type: "point", color: [0.3, 0.6, 0.9], intensity: 1.5, position: [4, 6, -4] },
      ],
      camera: { position: [0, 5, 12], target: [0, 1, 0], fov: 60 },
      sky: { type: "color", color: [0.05, 0.08, 0.16] },
    };
  }, [actors, behaviorPrompt, gridSize]);

  const compileBehavior = useCallback(async () => {
    if (!behaviorPrompt.trim()) return;
    setCompiling(true);
    setScript(null);
    setSavedPath(null);
    try {
      const scene = buildScene();

      const res = await fetch("/api/3d/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `game behavior: ${behaviorPrompt}` }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Compile failed");

      // Render the compiled scene in the viewport
      viewportRef.current?.renderScene(data.scene);

      // Save the compiled level (actors + AI scene) to the project
      setSaving(true);
      const slug = (behaviorPrompt.toLowerCase().match(/[a-z0-9]+/g) ?? ["level"]).slice(0, 4).join("_");
      const fileName = `levels/${slug}_${Date.now().toString(36)}.json`;
      const saveRes = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: {
            [fileName]: JSON.stringify({ ...scene, name: data.scene.name, description: data.scene.description }, null, 2),
          },
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to save level");
      setSavedPath(fileName);

      setScript(
        `// Compiled level "${data.scene.name}" → saved to ${fileName}\n// Prompt: ${behaviorPrompt}\n\n${scene.objects
          .map((o) => `spawn("${o.name}", { class: "${o.type}", at: [${o.position[0].toFixed(2)}, ${o.position[1].toFixed(2)}, ${o.position[2].toFixed(2)}] });`)
          .join("\n")}\n\nonEnterTrigger("Trigger Zone Volume", (zone) => {\n  log("${behaviorPrompt.split(" ").slice(0, 5).join(" ")}...");\n});`,
      );
    } catch (err: any) {
      logger.error("Compile behavior error:", err);
      setScript(`// Compilation failed: ${err?.message ?? "unknown error"}`);
    } finally {
      setCompiling(false);
      setSaving(false);
    }
  }, [behaviorPrompt, buildScene, projectId]);

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Spawnable Actor Directory */}
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 p-3">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5">Spawnable Class Actors</span>
        <div className="space-y-1">
          {ACTORS.map((actor) => (
            <div key={actor}>
              <button
                onClick={() => addActor(actor)}
                className="w-full text-left p-2 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-900 text-xs font-mono text-slate-300 transition"
              >
                <Box size={12} className="inline mr-1.5 text-blue-400" /> {actor}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5">Placed Actors</span>
          {actors.length === 0 && <p className="text-[11px] text-slate-600 font-mono">No actors placed — add them above.</p>}
          <div className="space-y-1">
            {actors.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 text-xs font-mono text-slate-300">
                <span className="truncate"><Box size={11} className="inline mr-1.5 text-cyan-400" /> {a.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-600">[{a.x},{a.y}]</span>
                  <button onClick={() => removeActor(a.id)} className="text-slate-600 hover:text-red-400 transition">✕</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Viewport Editor */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0 pb-14">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Grid3x3 size={13} className="text-cyan-400" /> Level Canvas ({gridSize}×{gridSize} units)
          </span>
          <div className="flex items-center gap-2">
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
            >
              {[8, 12, 16].map((n) => <option key={n} value={n}>{n}×{n}</option>)}
            </select>
            <button
              onClick={toggleTestPlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition ${
                testing ? "bg-red-900/50 text-red-300 hover:bg-red-900" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              {testing ? <><Pause size={12} /> Stop</> : <><Play size={12} /> Test Play</>}
            </button>
          </div>
        </div>

        <StudioViewport ref={viewportRef} className="flex-1" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[11px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-full">
          {testing ? "🎮 TEST PLAY — orbit camera flying over level" : "🎮 Add actors → they spawn as real 3D entities in the scene"}
        </div>
      </div>

      {/* AI Behavior Panel */}
      <div className="w-72 border-l border-slate-800 bg-slate-950 p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block flex items-center gap-1">
          <Cpu size={11} /> AI Behavior Compiler
        </span>
        <textarea
          value={behaviorPrompt}
          onChange={(e) => setBehaviorPrompt(e.target.value)}
          rows={4}
          placeholder="Prompt logic behaviors instead of writing blueprint code modules manually. e.g. 'enemies patrol between crates and flee when the player is near'..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-700 placeholder-slate-500 resize-none"
        />
        <button
          onClick={compileBehavior}
          disabled={compiling || !behaviorPrompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition"
        >
          {compiling ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {compiling ? (saving ? "Saving..." : "Compiling...") : "Compile Actor Script"}
        </button>

        {savedPath && <p className="text-[10px] font-mono text-emerald-400 break-all">✓ level saved {savedPath}</p>}

        {script && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1117] p-3">
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">Compiled Output</span>
            <pre className="text-[10px] leading-relaxed text-emerald-300/80 font-mono whitespace-pre-wrap">{script}</pre>
          </div>
        )}

        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5 flex items-center gap-1">
            <Users size={11} /> Event Script Node Tree
          </span>
          <div className="space-y-2">
            <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Zap size={13} /> ON TRIGGER ENTER
              </div>
              <div className="mt-2 pl-4 border-l border-amber-700/40 text-[11px] font-mono text-slate-400">
                Exec Output →
                {actors.filter((a) => a.type === "Trigger_Zone_Volume").length > 0 ? (
                  <span className="block mt-1 text-cyan-300">{actors.find((a) => a.type === "Trigger_Zone_Volume")?.name}</span>
                ) : (
                  <span className="block mt-1 text-slate-600">(no trigger zones placed)</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                🛠️ PLAY ANIMATION
              </div>
              <div className="mt-2 pl-4 border-l border-slate-700/40 text-[11px] font-mono text-slate-400">
                Target: <span className="text-cyan-300">{actors.find((a) => a.type === "Physics_Item_Crate")?.name ?? "Crate_01"}</span>
                <span className="block mt-1">Clip: Open_Mesh</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
