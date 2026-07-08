"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { GATEWAY_LAUNCH_MATRIX, resolveGatewayExperience } from "@/lib/gatewayLaunchMatrix";

type BuildMode = "wonderspace" | "component" | "website" | "game";
type AgentStage = "architect" | "builder" | "reviewer" | "runner";
type AgentStatus = "idle" | "running" | "done" | "error";

interface AgentEvent {
  stage: AgentStage;
  status: AgentStatus;
  label: string;
  message: string;
}

const MODE_OPTIONS: { value: BuildMode; icon: string; label: string }[] = [
  { value: "wonderspace", icon: "🧬", label: "Module"    },
  { value: "component",   icon: "🧩", label: "Component" },
  { value: "website",     icon: "🌐", label: "Website"   },
  { value: "game",        icon: "🎮", label: "Game"      },
];

const STAGE_ORDER: AgentStage[] = ["architect", "builder", "reviewer", "runner"];
const STAGE_ICONS: Record<AgentStage, string> = {
  architect: "🏗️", builder: "⚙️", reviewer: "🔍", runner: "🚀",
};

const EXAMPLES: Record<BuildMode, string> = {
  wonderspace: "A React hook that fetches and caches PlayCanvas scene metadata",
  component:   "An animated file tree explorer with expand/collapse and file icons",
  website:     "A developer portfolio with dark theme, project grid, and contact form",
  game:        "A top-down space shooter with waves of enemies and power-ups",
};

const CLOUD_HEALTH_CHECK = [
  { item: "Storage Space", status: "🟢 500GB OK", requirement: "Required for Wonderplay/WebGPU assets" },
  { item: "GPU Driver", status: "🟢 NVIDIA 535+", requirement: "Required for Pixel Streaming" },
  { item: "Container Engine", status: "🟢 Docker / Podman", requirement: "Required for Manifestation" },
];

export default function WonderSpacePage() {
  const [mode, setMode] = useState<BuildMode>("wonderspace");
  const [prompt, setPrompt] = useState("");
  const [agents, setAgents] = useState<Partial<Record<AgentStage, AgentEvent>>>({});
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState("");
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [saveToRunner, setSaveToRunner] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runBuild = useCallback(async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setAgents({});
    setCode("");
    setPlan("");
    setSavedPath(null);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/build/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: mode, save: saveToRunner }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const chunk of parts) {
          const lines   = chunk.split("\n");
          const evLine  = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!evLine || !dataLine) continue;
          const ev   = evLine.replace("event:", "").trim();
          const data = JSON.parse(dataLine.replace("data:", "").trim());
          if (ev === "agent")    setAgents((p) => ({ ...p, [data.stage]: data }));
          if (ev === "complete") {
            setCode(data.code);
            setPlan(data.plan ?? "");
            if (data.savedPath) setSavedPath(data.savedPath);
          }
          if (ev === "error") setError(data.message);
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setError(e.message ?? "Build failed");
    } finally {
      setRunning(false);
    }
  }, [prompt, mode, running, saveToRunner]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileExt = mode === "game" || mode === "website" ? "html" : "tsx";
  const hasStarted = Object.keys(agents).length > 0 || !!code || !!error;
  const gatewayExperience = resolveGatewayExperience(mode);
  const activeServices = GATEWAY_LAUNCH_MATRIX[gatewayExperience];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-5 py-3 flex items-center gap-3 shrink-0">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "WonderSpace" }]} />
        <div className="ml-auto flex items-center gap-4">
          {[
            { href: "/wonder-build/ai-builder", label: "✨ Wonderbuild", color: "text-violet-400" },
            { href: "/wonder-build/playcanvas", label: "🌐 3D Studio", color: "text-blue-400" },
            { href: "/dashboard/agents", label: "🤖 Agents", color: "text-cyan-400" },
            { href: "/wonderspace/ide", label: "🚀 Launch IDE", color: "text-emerald-400" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className={`text-xs ${l.color} hover:opacity-80 transition-opacity`}>
              {l.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LEFT — AI Controls */}
        <div className="w-64 min-w-[220px] border-r border-white/10 flex flex-col overflow-y-auto bg-[#0c0c13]">
          <div className="p-4 flex flex-col gap-4">
            {/* Mode selector */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Mode</p>
              <div className="grid grid-cols-2 gap-1">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setMode(opt.value); setCode(""); setAgents({}); setError(null); }}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-all ${
                      mode === opt.value
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70"
                    }`}
                  >
                    <span className="text-sm">{opt.icon}</span>
                    <span className="text-[11px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 block">Describe</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runBuild(); }}
                placeholder={EXAMPLES[mode]}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 resize-none focus:outline-none focus:border-violet-500 font-mono"
              />
              <p className="text-[9px] text-white/20 mt-1">⌘+Enter to run</p>
            </div>

            {/* Save to runner toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={saveToRunner}
                onClick={() => setSaveToRunner((v) => !v)}
                className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${saveToRunner ? "bg-violet-600" : "bg-white/10"}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${saveToRunner ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <span className="text-[11px] text-white/40">Save to Runners</span>
            </label>

            {/* Build button */}
            {!running ? (
              <button
                onClick={runBuild}
                disabled={!prompt.trim()}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ✨ Generate
              </button>
            ) : (
              <button
                onClick={() => { abortRef.current?.abort(); setRunning(false); }}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-red-600/20 border border-red-500/30 text-red-400"
              >
                ⏹ Stop
              </button>
            )}
          </div>

          {/* Agent log */}
          {hasStarted && (
            <div className="border-t border-white/10 p-4 flex flex-col gap-1.5">
              <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Agent Log</p>
              {STAGE_ORDER.map((stage) => {
                const ev = agents[stage];
                if (!ev && stage === "runner" && !saveToRunner) return null;
                const status = ev?.status ?? "idle";
                return (
                  <div key={stage} className={`rounded-md p-2 border transition-all ${
                    status === "running" ? "border-violet-500/40 bg-violet-500/5" :
                    status === "done"    ? "border-green-500/30 bg-green-500/5" :
                    "border-white/5 opacity-25"
                  }`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-xs">{STAGE_ICONS[stage]}</span>
                      <span className="text-[10px] font-medium text-white/60">
                        {ev?.label ?? stage}
                      </span>
                      <div className="ml-auto">
                        {status === "running" && (
                          <span className="flex gap-0.5">
                            {[0,1,2].map((i) => (
                              <span key={i} className="w-0.5 h-0.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                            ))}
                          </span>
                        )}
                        {status === "done" && <span className="text-green-400 text-[10px]">✓</span>}
                      </div>
                    </div>
                    {ev?.message && <p className="text-[9px] text-white/35 line-clamp-2">{ev.message}</p>}
                  </div>
                );
              })}
              {error && (
                <div className="rounded-md p-2 border border-red-500/30 bg-red-500/5 mt-1">
                  <p className="text-[10px] text-red-400 font-medium">⚠ {error.slice(0, 100)}</p>
                </div>
              )}
              {savedPath && (
                <div className="rounded-md p-2 border border-violet-500/30 bg-violet-500/5 mt-1">
                  <p className="text-[10px] text-violet-300">🚀 Saved to runner</p>
                  <p className="text-[9px] text-white/25 font-mono mt-0.5 break-all">
                    {savedPath.split("/").slice(-2).join("/")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Workspace links */}
          <div className="border-t border-white/10 p-4 mt-auto">
            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2">Workspace</p>
            <div className="mb-3 rounded-md border border-white/10 bg-white/[0.02] p-2">
              <p className="text-[9px] uppercase tracking-widest text-white/35">
                Gateway Mode: {gatewayExperience === "game" ? "Game" : "Web/App"}
              </p>
              <ul className="mt-1 space-y-1">
                {activeServices.map((service) => (
                  <li key={`${service.name}-${service.port}`} className="text-[10px] text-white/45">
                    {service.name} · :{service.port} · {service.purpose}
                  </li>
                ))}
              </ul>
            </div>
            {[
              { href: "/wonder-build/ai-builder",       label: "Wonderbuild AI" },
              { href: "/wonder-build/puck",              label: "Wonderbuild UI" },
              { href: "/wonder-build/playcanvas",            label: "Wonderplay 3D" },
              { href: "/dashboard/editor-playcanvas",    label: "PlayCanvas Bridge" },
              { href: "/dashboard/agents",               label: "Agent Dashboard" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center py-1 text-[10px] text-white/30 hover:text-white/60 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT — Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-[#0c0c13] shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="text-[10px] text-white/25 font-mono ml-2">
              {code ? `wonder-output.${fileExt}` : "no file open"}
            </span>
            <div className="ml-auto flex gap-2">
              {code && (
                <>
                  <button onClick={copyCode} className="px-2.5 py-1 rounded text-[10px] border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-colors">
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(code)}`}
                    download={`wonder-output.${fileExt}`}
                    className="px-2.5 py-1 rounded text-[10px] border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-colors"
                  >
                    Download
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Code area */}
          <div className="flex-1 overflow-auto bg-[#080810] relative">
            {code ? (
              <pre className="p-6 text-[11px] font-mono text-emerald-300/80 leading-relaxed whitespace-pre-wrap break-words">
                <code>{code}</code>
              </pre>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
                {running ? (
                  <>
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-ping" />
                      <div className="absolute inset-3 rounded-full flex items-center justify-center text-xl">
                        {STAGE_ICONS[
                          (Object.entries(agents).find(([, v]) => v?.status === "running")?.[0] as AgentStage) ?? "architect"
                        ]}
                      </div>
                    </div>
                    <p className="text-white/40 text-xs">Agents generating code…</p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">🧬</span>
                    <div>
                      <p className="text-white/50 text-sm font-semibold">WonderSpace IDE</p>
                      <p className="text-white/25 text-xs mt-1 max-w-xs">
                        AI-powered editor. Describe what to build, pick a mode, and agents will generate production code here.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
