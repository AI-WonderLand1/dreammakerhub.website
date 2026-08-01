"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Users,
  Trash2,
  ArrowLeft,
  UserPlus,
  Activity,
} from "lucide-react";
import { logger } from "@/lib/logger";

type TraitSet = { aggression: number; sociability: number; ambition: number };

type Npc = {
  id: string;
  name: string;
  hunger: number;
  social: number;
  stress: number;
  traits: TraitSet;
  status: "alive" | "dead";
  age: number;
};

type SimEvent = {
  npcId: string;
  action: string;
  hunger: number;
  social: number;
  stress: number;
};

export default function NpcSimPage() {
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [population, setPopulation] = useState(5);

  const runTick = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/3d/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tick" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Tick failed");
      setNpcs(data.npcs);
      setTick(data.tick);
      setEvents(data.events ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Simulation tick failed");
      logger.error("NPC tick error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSim = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/3d/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", count: population }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Create failed");
      setNpcs(data.npcs);
      setTick(0);
      setEvents([]);
      setRunning(false);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create simulation");
      logger.error("NPC create error:", err);
    } finally {
      setLoading(false);
    }
  }, [population]);

  const addNpc = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/3d/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", name: newName || undefined }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Add failed");
      setNpcs(data.npcs);
      setNewName("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to add NPC");
    } finally {
      setLoading(false);
    }
  }, [newName]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      void runTick();
    }, 1200);
    return () => window.clearInterval(interval);
  }, [running, runTick]);

  const activeAction = (npcId: string) => {
    const evt = events.find((e) => e.npcId === npcId);
    return evt?.action ?? "idle";
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 font-sans overflow-hidden select-none">
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            <Cpu size={16} />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wide block text-white">NPC SIMULATOR</span>
            <span className="text-[10px] text-slate-400 font-mono block -mt-1">AI UTILITY-BASED AGENTS · TICK {tick}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/3dhub"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 transition"
          >
            <ArrowLeft size={13} /> Back to Studio
          </Link>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full animate-pulse ${running ? "bg-emerald-400" : "bg-amber-400"}`}></span>
            <span className="font-medium font-mono">{running ? "SIMULATING" : "PAUSED"}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: control board */}
        <div className="w-72 border-r border-slate-800 bg-slate-950 p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block">Simulation Control</span>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Starting population</span>
              <select
                value={population}
                onChange={(e) => setPopulation(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
              >
                {[3, 5, 8, 12].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              onClick={createSim}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition"
            >
              <Users size={14} /> {npcs.length ? "Reset World" : "Create World"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                disabled={npcs.length === 0}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-2 rounded-lg text-[11px] font-semibold transition"
              >
                {running ? <Pause size={12} /> : <Play size={12} />} {running ? "Pause" : "Run"}
              </button>
              <button
                onClick={runTick}
                disabled={loading || npcs.length === 0}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-2 rounded-lg text-[11px] font-semibold transition"
              >
                <RotateCcw size={12} /> Step
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block">Add an Agent</span>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Agent name"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-700 placeholder-slate-600"
              />
              <button
                onClick={addNpc}
                disabled={loading}
                className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-40"
              >
                <UserPlus size={13} />
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg p-2.5">{error}</p>}

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">How it works</span>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Each agent has three needs — <span className="text-amber-300">hunger</span>,{" "}
              <span className="text-sky-300">social</span>, <span className="text-rose-300">stress</span>. Every tick,
              needs decay and the utility-AI picks the highest-scoring action (eat, socialize, rest, work, or flee) to
              satisfy them.
            </p>
          </div>
        </div>

        {/* Right: agent panels */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
          {npcs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Cpu size={48} className="stroke-1 text-slate-700 mb-4" />
              <p className="text-sm font-mono text-slate-400">No simulation running yet.</p>
              <p className="mt-1 text-xs font-mono text-slate-600">Create a world to spawn AI agents.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {npcs.map((npc) => (
                <AgentCard key={npc.id} npc={npc} action={activeAction(npc.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  const danger = value > 70;
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono mb-0.5">
        <span className="text-slate-500">{label}</span>
        <span className={danger ? "text-red-400 font-bold" : "text-slate-400"}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${danger ? "bg-red-500" : color}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function TraitBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-900/60 px-2 py-1">
      <span className="text-[9px] font-mono text-slate-500">{label}</span>
      <span className="text-[10px] font-mono text-slate-300">{Math.round(value * 100)}</span>
    </div>
  );
}

function AgentCard({ npc, action }: { npc: Npc; action: string }) {
  const actionColor =
    action === "eat"
      ? "text-amber-300"
      : action === "socialize"
        ? "text-sky-300"
        : action === "rest"
          ? "text-emerald-300"
          : action === "flee"
            ? "text-rose-400"
            : action === "work"
              ? "text-violet-300"
              : "text-slate-500";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
            {npc.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{npc.name}</p>
            <p className="text-[10px] font-mono text-slate-500">{npc.id} · age {npc.age}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold font-mono uppercase ${actionColor} flex items-center gap-1`}>
          <Activity size={11} /> {action}
        </span>
      </div>

      <div className="space-y-2">
        <NeedBar label="HUNGER" value={npc.hunger} color="bg-amber-400" />
        <NeedBar label="SOCIAL" value={npc.social} color="bg-sky-400" />
        <NeedBar label="STRESS" value={npc.stress} color="bg-rose-400" />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <TraitBadge label="AGR" value={npc.traits.aggression} />
        <TraitBadge label="SOC" value={npc.traits.sociability} />
        <TraitBadge label="AMB" value={npc.traits.ambition} />
      </div>
    </div>
  );
}
