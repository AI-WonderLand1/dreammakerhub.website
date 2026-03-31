"use client";

import { useState } from "react";
// Ensure this matches your directory: lib/agents.ts
import { Platform } from "@lib/agents"; 
import { logger } from "@lib/logger";

type AgentTask = {
  agent: string;
  command: string;
  platform: Platform;
  output?: string;
  status: "success" | "warning" | "error";
};

export default function SpiritGuide() {
  const [value, setValue] = useState("");
  const [activePlatform, setActivePlatform] = useState<Platform>("multi");
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  async function runAgent(agent: string, command: string) {
    if (!command && agent !== "cleanup") return;
    
    setIsBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          agent, 
          command, 
          platform: activePlatform // Passing platform context
        }),
      });

      const data = await res.json();

      const newTask: AgentTask = {
        agent,
        command: command || "Executed",
        platform: activePlatform,
        output: data.answer || data.content,
        status: data.status === "blocked" ? "error" : "success"
      };

      setTasks((prev) => [newTask, ...prev]); // Newest tasks first
    } catch (err) {
      logger.error("Agent Execution Failed", { error: err });
    } finally {
      setIsBusy(false);
      setValue("");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-[0_0_70px_rgba(168,85,247,0.28)] overflow-hidden transition-all duration-500">
      {/* Header with Platform Indicator */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex flex-col">
          <span className="font-semibold tracking-wide text-white">✦ Spirit Manager</span>
          <span className="text-[10px] uppercase text-purple-400 font-bold tracking-tighter">
            Target: {activePlatform}
          </span>
        </div>
        <div className="flex gap-1">
          {["web", "ios", "android"].map((p) => (
            <button
              key={p}
              onClick={() => setActivePlatform(p as Platform)}
              className={`text-[9px] px-2 py-0.5 rounded border ${
                activePlatform === p 
                ? "bg-purple-500 border-purple-400 text-white" 
                : "border-white/10 text-white/40"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        {/* Input Area */}
        <div className="relative">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Describe your vision..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          {isBusy && (
            <div className="absolute right-3 top-3.5">
              <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Multi-Platform Agent Grid */}
        <div className="grid grid-cols-3 gap-2">
          {["chat", "vision", "install", "cleanup", "image-to-code", "scan"].map((agent) => (
            <button
              key={agent}
              disabled={isBusy}
              onClick={() => runAgent(agent, value)}
              className="rounded-xl border border-white/10 bg-white/5 py-2 text-[11px] text-white/70 hover:bg-purple-500/20 hover:border-purple-500/40 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {agent}
            </button>
          ))}
        </div>

        {/* Unified Task & Scan Log */}
        <div className="space-y-3">
          {tasks.map((t, i) => (
            <div 
              key={i} 
              className={`rounded-xl border p-3 text-xs animate-in slide-in-from-top-2 duration-300 ${
                t.status === "error" ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-purple-400 font-mono">[{t.agent}]</span>
                <span className="text-[10px] text-white/30">{t.platform}</span>
              </div>
              <p className="text-white/90 mb-2 italic">"{t.command}"</p>
              <div className="text-white/50 leading-relaxed bg-black/20 p-2 rounded-lg font-mono text-[10px] overflow-x-auto">
                {t.output}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
