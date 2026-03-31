"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type BuildType = "website" | "game" | "component";
type AgentStage = "architect" | "builder" | "reviewer";
type AgentStatus = "idle" | "running" | "done" | "error";

interface AgentEvent {
  stage: AgentStage;
  status: AgentStatus;
  label: string;
  message: string;
}

interface BuildResult {
  type: BuildType;
  code: string;
  plan: string;
  timestamp: number;
}

const TYPE_OPTIONS: { value: BuildType; label: string; icon: string; desc: string }[] = [
  { value: "website", icon: "🌐", label: "Website", desc: "Landing pages, portfolios, dashboards" },
  { value: "game",    icon: "🎮", label: "Game",    desc: "Playable HTML5 Canvas games" },
  { value: "component", icon: "🧩", label: "Component", desc: "Interactive React UI components" },
];

const STAGE_ORDER: AgentStage[] = ["architect", "builder", "reviewer"];

const STAGE_INFO: Record<AgentStage, { icon: string; color: string }> = {
  architect: { icon: "🏗️", color: "violet" },
  builder:   { icon: "⚙️", color: "blue" },
  reviewer:  { icon: "🔍", color: "green" },
};

const EXAMPLES: Record<BuildType, string[]> = {
  website: [
    "A dark sci-fi portfolio for a 3D artist with animated hero and project gallery",
    "A luxury hotel landing page with parallax images and booking CTA",
    "A SaaS dashboard with sidebar, analytics cards, and data table",
  ],
  game: [
    "A classic snake game with neon colors and increasing speed",
    "A space shooter where you dodge asteroids and collect power-ups",
    "A brick breaker game with colorful bricks and bouncing ball",
  ],
  component: [
    "An animated pricing table with monthly/yearly toggle and feature comparison",
    "A sleek multi-step form wizard with progress indicator",
    "A music player UI with album art, waveform, and controls",
  ],
};

export default function AIBuilderPage() {
  const [buildType, setBuildType] = useState<BuildType>("website");
  const [prompt, setPrompt] = useState("");
  const [agents, setAgents] = useState<Partial<Record<AgentStage, AgentEvent>>>({});
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const previewRef = useRef<HTMLIFrameElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runBuild = useCallback(async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setAgents({});
    setResult(null);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/build/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: buildType }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");

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
          const lines = chunk.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine  = lines.find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;

          const eventName = eventLine.replace("event:", "").trim();
          const data = JSON.parse(dataLine.replace("data:", "").trim());

          if (eventName === "agent") {
            setAgents((prev) => ({ ...prev, [data.stage]: data }));
          } else if (eventName === "complete") {
            setResult(data);
          } else if (eventName === "error") {
            setError(data.message);
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setError(e.message ?? "Build failed");
    } finally {
      setRunning(false);
    }
  }, [prompt, buildType, running]);

  const stopBuild = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const copyCode = () => {
    if (result?.code) navigator.clipboard.writeText(result.code);
  };

  const downloadFile = () => {
    if (!result) return;
    const ext = "html";
    const blob = new Blob([result.code], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wonder-build.${ext}`;
    a.click();
  };

  const isBuilding = running;
  const isDone = !!result;
  const hasStarted = Object.keys(agents).length > 0 || isDone || !!error;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/wonder-build" className="text-white/50 hover:text-white transition-colors text-sm">
          ← Wonder Build
        </Link>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-sm font-semibold tracking-wide">
          <span className="text-violet-400">AI</span> Builder
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/50">Gemini 2.0 Flash</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL — Controls + Agent Log */}
        <div className="w-[380px] min-w-[320px] border-r border-white/10 flex flex-col overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">
            {/* Type selector */}
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest mb-3 block">
                What are you building?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setBuildType(opt.value); setResult(null); setAgents({}); setError(null); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center ${
                      buildType === opt.value
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/30 mt-2">
                {TYPE_OPTIONS.find((o) => o.value === buildType)?.desc}
              </p>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest mb-3 block">
                Describe what you want
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runBuild(); }}
                placeholder={`Describe your ${buildType}…`}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500 transition-colors"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {EXAMPLES[buildType].slice(0, 2).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="text-[10px] text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-1 transition-colors text-left"
                  >
                    {ex.length > 50 ? ex.slice(0, 48) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Build button */}
            {!isBuilding ? (
              <button
                onClick={runBuild}
                disabled={!prompt.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-900/30"
              >
                ✨ Build with AI
              </button>
            ) : (
              <button
                onClick={stopBuild}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-all"
              >
                ⏹ Stop
              </button>
            )}
          </div>

          {/* Agent Activity */}
          {hasStarted && (
            <div className="border-t border-white/10 p-6 flex flex-col gap-3">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Agent Activity</p>
              {STAGE_ORDER.map((stage) => {
                const ev = agents[stage];
                const info = STAGE_INFO[stage];
                const status: AgentStatus = ev?.status ?? "idle";
                const isActive = status === "running";
                const isDoneStage = status === "done";
                const isPending = !ev;

                return (
                  <div
                    key={stage}
                    className={`rounded-xl p-3 border transition-all ${
                      isActive
                        ? "border-violet-500/40 bg-violet-500/5"
                        : isDoneStage
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-white/5 bg-white/[0.02] opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{info.icon}</span>
                      <span className="text-xs font-semibold text-white/80">
                        {ev?.label ?? stage.charAt(0).toUpperCase() + stage.slice(1) + " Agent"}
                      </span>
                      <div className="ml-auto">
                        {isActive && (
                          <span className="flex gap-[3px] items-center">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </span>
                        )}
                        {isDoneStage && <span className="text-green-400 text-xs">✓</span>}
                      </div>
                    </div>
                    {ev?.message && (
                      <p className="text-[11px] text-white/50 leading-relaxed">{ev.message}</p>
                    )}
                  </div>
                );
              })}

              {error && (
                <div className="rounded-xl p-3 border border-red-500/30 bg-red-500/5">
                  <p className="text-xs text-red-400 font-semibold mb-1">⚠ Build Error</p>
                  <p className="text-[11px] text-red-300/70">{error}</p>
                </div>
              )}

              {result && !isBuilding && (
                <div className="rounded-xl p-3 border border-green-500/40 bg-green-500/5">
                  <p className="text-xs text-green-400 font-semibold">🎉 Build complete!</p>
                  <p className="text-[11px] text-white/40 mt-1">
                    {(result.code.length / 1024).toFixed(1)} KB generated
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Preview + Code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {result ? (
            <>
              {/* Tabs + actions */}
              <div className="flex items-center gap-1 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                <div className="flex gap-1">
                  {(["preview", "code"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        tab === t
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {t === "preview" ? "👁 Preview" : "📄 Code"}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={copyCode}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={downloadFile}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => { setResult(null); setAgents({}); setError(null); }}
                    className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                  >
                    Build again
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {tab === "preview" ? (
                  <iframe
                    ref={previewRef}
                    srcDoc={result.code}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-0 bg-white"
                    title="Live Preview"
                  />
                ) : (
                  <div className="h-full overflow-auto bg-[#0d0d16] p-6">
                    <pre className="text-xs text-white/70 font-mono leading-relaxed whitespace-pre-wrap break-words">
                      {result.code}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 text-center">
              {isBuilding ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-violet-500/50 animate-ping" style={{ animationDelay: "0.3s" }} />
                    <div className="absolute inset-4 rounded-full bg-violet-600/20 flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/80 font-semibold">Agents are building…</p>
                    <p className="text-white/30 text-sm mt-1">This takes about 20–40 seconds</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="text-6xl mb-4">🪄</div>
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    AI Wonder Build
                  </h2>
                  <p className="text-white/40 text-sm leading-relaxed mb-6">
                    Describe what you want to build. Three AI agents will collaborate — an Architect to plan, a Builder to code, and a Reviewer to polish — then your creation appears live.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {TYPE_OPTIONS.map((opt) => (
                      <div key={opt.value} className="rounded-xl border border-white/10 p-3 bg-white/5">
                        <div className="text-2xl mb-1">{opt.icon}</div>
                        <div className="text-xs font-medium text-white/70">{opt.label}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
