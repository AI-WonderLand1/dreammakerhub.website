"use client";

import { useCallback, useState } from "react";
import { Play, Users, Cpu, Box, Zap, Grid3x3 } from "lucide-react";
import { logger } from "@/lib/logger";

const ACTORS = ["System_Player_Rig", "Dynamic_Enemy_AI", "Physics_Item_Crate", "Trigger_Zone_Volume"];

type ActorNode = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
};

export default function StudioGameBuilder() {
  const [actors, setActors] = useState<ActorNode[]>([
    { id: "a1", name: "Player_Rig", type: "System_Player_Rig", x: 3, y: 3 },
    { id: "a2", name: "Crate_01", type: "Physics_Item_Crate", x: 7, y: 2 },
  ]);
  const [behaviorPrompt, setBehaviorPrompt] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(12);

  const addActor = useCallback((type: string) => {
    const idx = actors.length + 1;
    setActors((prev) => [
      ...prev,
      { id: `a${Date.now()}`, name: `${type.replace("System_", "").replace("Physics_", "").replace("Dynamic_", "").replace("Trigger_", "")}_${idx}`, type, x: idx % gridSize, y: Math.floor(idx / gridSize) },
    ]);
  }, [actors.length, gridSize]);

  const removeActor = useCallback((id: string) => {
    setActors((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const compileBehavior = useCallback(async () => {
    if (!behaviorPrompt.trim()) return;
    setCompiling(true);
    setScript(null);
    try {
      const res = await fetch("/api/3d/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `game behavior: ${behaviorPrompt}` }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Compile failed");

      setScript(
        `// Compiled behavior from prompt:\n// ${behaviorPrompt}\n\n${actors
          .map((a) => `spawn("${a.name}", { class: "${a.type}", at: [${a.x}, 0, ${a.y}] });`)
          .join("\n")}\n\nonEnterTrigger("Trigger_Zone_Volume", (zone) => {\n  log("${behaviorPrompt.split(" ").slice(0, 4).join(" ")}...");\n});`,
      );
    } catch (err: any) {
      logger.error("Compile behavior error:", err);
      setScript(`// Compilation failed: ${err?.message ?? "unknown error"}`);
    } finally {
      setCompiling(false);
    }
  }, [behaviorPrompt, actors]);

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
          {actors.length === 0 && <p className="text-[11px] text-slate-600 font-mono">No actors placed yet.</p>}
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
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
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
            <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-[11px] font-semibold transition">
              <Play size={12} /> Test Play
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,#1e293b,#020617)] overflow-hidden p-4">
          <div className="absolute inset-4 rounded-xl border border-slate-800 bg-slate-950/40">
            {/* Grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
                backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`,
              }}
            />
            {/* Actors */}
            {actors.map((a) => (
              <button
                key={a.id}
                onClick={() => logger.info("selected", a.name)}
                className="absolute flex flex-col items-center group"
                style={{ left: `${(a.x / gridSize) * 100}%`, top: `${(a.y / gridSize) * 100}%` }}
              >
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/70 to-blue-600/70 border border-cyan-300/40 flex items-center justify-center group-hover:scale-110 transition">
                  <Box size={16} className="text-white" />
                </span>
                <span className="mt-1 text-[9px] font-mono text-slate-400 bg-slate-950/70 px-1.5 py-0.5 rounded">{a.name}</span>
              </button>
            ))}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-mono text-slate-500">
              🎮 Drag items from the left panel to position them in the scene space.
            </div>
          </div>
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
          <Zap size={14} /> {compiling ? "Compiling..." : "Compile Actor Script"}
        </button>

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
