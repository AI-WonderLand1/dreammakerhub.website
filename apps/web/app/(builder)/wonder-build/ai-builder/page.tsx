"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { htmlToPuckBlocks, storePuckData } from "@/lib/ai-to-puck";
import { AssetLibrary } from "@/components/ai/AssetLibrary";
import { logger } from '@/lib/logger';

type BuildType = "website" | "game" | "component" | "3d-assets" | "playcanvas";
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

const TYPE_OPTIONS: { value: BuildType; label: string; icon: string; desc: string; pricing?: string }[] = [
  { value: "website", icon: "🌐", label: "Website", desc: "Landing pages, portfolios, dashboards" },
  { value: "game", icon: "🎮", label: "Game", desc: "Playable HTML5 Canvas games" },
  { value: "component", icon: "🧩", label: "Component", desc: "Interactive React UI components" },
  { value: "3d-assets", icon: "🎨", label: "3D Assets", desc: "Websites with embedded 3D models and assets" },
  { value: "playcanvas", icon: "🎮", label: "PlayCanvas Scene", desc: "3D scenes for the PlayCanvas editor" },
];

const STAGE_ORDER: AgentStage[] = ["architect", "builder", "reviewer"];

const STAGE_INFO: Record<AgentStage, { icon: string; color: string }> = {
  architect: { icon: "🏗️", color: "violet" },
  builder: { icon: "⚙️", color: "blue" },
  reviewer: { icon: "🔍", color: "green" },
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
  "3d-assets": [
    "A product showcase with rotating 3D model viewer",
    "An architectural portfolio with interactive building models",
    "A tech company homepage with animated 3D elements",
  ],
  playcanvas: [
    "A sci-fi room with neon lights and a holographic display",
    "An outdoor forest scene with dynamic lighting and fog",
    "A space scene with orbiting planets and particle effects",
  ],
};

export default function AIBuilderPage() {
  const router = useRouter();
  const [buildType, setBuildType] = useState<BuildType>("website");
  const [prompt, setPrompt] = useState("");
  const [agents, setAgents] = useState<Partial<Record<AgentStage, AgentEvent>>>({});
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [droppedAssets, setDroppedAssets] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const handleAssetDrop = useCallback((asset: any) => {
    setDroppedAssets(prev => [...prev, asset.id]);
    // Add the asset to the current prompt
    setPrompt(prev => `${prev} Include ${asset.name} ${asset.type}`);
  }, []);

  const acceptToPuck = useCallback(async () => {
    if (!result?.code) return;
    try {
      const puckData = await htmlToPuckBlocks(result.code);
      const dataKey = storePuckData(puckData);
      router.push(`/wonder-build/puck?ai_data=${dataKey}`);
    } catch (err) {
      logger.error("[Wonderbuild] Failed to accept to Puck:", err);
      alert("Failed to prepare content for Puck editor");
    }
  }, [result?.code, router]);

  useEffect(() => {
    if (!result?.code) {
      setPreviewBlobUrl(null);
      return;
    }
    const blob = new Blob([result.code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setPreviewBlobUrl(url);
    return () => { URL.revokeObjectURL(url); };
  }, [result?.code]);

  const runBuild = useCallback(async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setAgents({});
    setResult(null);
    setError(null);
    abortRef.current = new AbortController();

    // Build enhanced prompt with dropped assets
    let enhancedPrompt = prompt;
    if (droppedAssets.length > 0) {
      enhancedPrompt += ` (Includes 3D assets: ${droppedAssets.join(", ")})`;
    }

    try {
      const res = await fetch("/api/build/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: enhancedPrompt, type: buildType }),
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
          const dataLine = lines.find((l) => l.startsWith("data:"));
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

  const stopBuild = () => { abortRef.current?.abort(); setRunning(false); };
  const copyCode = () => { if (result?.code) navigator.clipboard.writeText(result.code); };
  const downloadFile = () => {
    if (!result) return;
    const blob = new Blob([result.code], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wonder-build.html";
    a.click();
  };

  const acceptProject = useCallback(async () => {
    if (!result || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects/create-from-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: buildType, code: result.code, prompt }),
      });
      const data = await res.json();
      if (data.url) { router.push(data.url); }
      else {
        alert("Project saved! Redirecting to editor...");
        router.push(`/wonder-build/puck?project=${data.projectId}`);
      }
    } catch (err) {
      logger.error("Failed to save project:", err);
      alert("Failed to save project. Please try again.");
    } finally { setSaving(false); }
  }, [result, buildType, prompt, router, saving]);

  const isBuilding = running;
  const isDone = !!result;
  const hasStarted = Object.keys(agents).length > 0 || isDone || !!error;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/wonder-build" className="text-white/50 hover:text-white transition-colors text-sm">
          &larr; Wonder Build
        </Link>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-sm font-semibold tracking-wide">
          <span className="text-violet-400">Wonder</span>build
        </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/50">Gemini 2.0 Flash</span>
              </div>
      </header>

      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        <div className="w-[380px] min-w-[320px] border-r border-white/10 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 flex flex-col gap-6">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-3 block">What are you building?</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => { setBuildType(opt.value); setResult(null); setAgents({}); setError(null); }} className={"flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center relative " + (buildType === opt.value ? "border-violet-500 bg-violet-500/10 text-white" : "border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:text-white")}>
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-xs font-medium">{opt.label}</span>
                      {opt.pricing && (
                        <span className="absolute -top-1 -right-1 text-[8px] bg-yellow-500/20 text-yellow-300 px-1 py-0.5 rounded-full border border-yellow-500/30">
                          {opt.pricing}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/30 mt-2">{TYPE_OPTIONS.find((o) => o.value === buildType)?.desc}</p>
              </div>

               <div>
                 <label className="text-xs text-white/50 uppercase tracking-widest mb-3 block">Describe what you want</label>
                 <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runBuild(); }} placeholder={"Describe your " + buildType + "..."} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500 transition-colors" />
                 <div className="mt-2 flex flex-wrap gap-1">
                   {EXAMPLES[buildType].slice(0, 2).map((ex) => (
                     <button key={ex} onClick={() => setPrompt(ex)} className="text-[10px] text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-1 transition-colors text-left">
                       {ex.length > 50 ? ex.slice(0, 48) + "..." : ex}
                     </button>
                   ))}
                 </div>
                 
                  {(buildType === "3d-assets" || buildType === "playcanvas") && (
                    <div className="mt-4">
                      <AssetLibrary onAssetDrop={handleAssetDrop} />
                      
                      {droppedAssets.length > 0 && (
                        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-xs text-green-300">
                            <span className="font-semibold">Assets added:</span> {droppedAssets.join(", ")}
                          </p>
                          <button 
                            onClick={() => setDroppedAssets([])}
                            className="text-xs text-green-300/70 hover:text-green-300 mt-1"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                 </div>

              {!isBuilding ? (
                <button onClick={runBuild} disabled={!prompt.trim()} className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-900/30">
                  Build with AI
                </button>
              ) : (
                <button onClick={stopBuild} className="w-full py-3 rounded-xl font-semibold text-sm bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-all">
                  Stop
                </button>
              )}
            </div>

            {hasStarted && (
              <div className="border-t border-white/10 p-6 flex flex-col gap-3">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Agent Activity</p>
                {STAGE_ORDER.map((stage) => {
                  const ev = agents[stage];
                  const info = STAGE_INFO[stage];
                  const status: AgentStatus = ev?.status ?? "idle";
                  const isActive = status === "running";
                  const isDoneStage = status === "done";
                  return (
                    <div key={stage} className={"rounded-xl p-3 border transition-all " + (isActive ? "border-violet-500/40 bg-violet-500/5" : isDoneStage ? "border-green-500/30 bg-green-500/5" : "border-white/5 bg-white/[0.02] opacity-40")}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{info.icon}</span>
                        <span className="text-xs font-semibold text-white/80">{ev?.label ?? stage.charAt(0).toUpperCase() + stage.slice(1) + " Agent"}</span>
                      </div>
                      {ev?.message && <p className="text-[11px] text-white/50 leading-relaxed">{ev.message}</p>}
                      {isActive && <span className="text-xs text-violet-400">Running...</span>}
                      {isDoneStage && <span className="text-xs text-green-400">Done</span>}
                    </div>
                  );
                })}

                {error && (
                  <div className="rounded-xl p-3 border border-red-500/30 bg-red-500/5">
                    <p className="text-xs text-red-400 font-semibold mb-1">Build Error</p>
                    <p className="text-[11px] text-red-300/70">{error}</p>
                  </div>
                )}

                {result && !isBuilding && (
                  <div className="rounded-xl p-3 border border-green-500/40 bg-green-500/5">
                    <p className="text-xs text-green-400 font-semibold">Build complete!</p>
                    <p className="text-[11px] text-white/40 mt-1">{(result.code.length / 1024).toFixed(1)} KB generated</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {result ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                <div className="flex gap-1">
                  <button onClick={() => setViewMode("preview")} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (viewMode === "preview" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>Preview</button>
                  <button onClick={() => setViewMode("code")} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (viewMode === "code" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>Code</button>
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={copyCode} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">Copy</button>
                  <button onClick={downloadFile} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">Download</button>
                  <button onClick={acceptProject} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/30">{saving ? "Saving..." : "Accept & Edit"}</button>
                  {result?.type === "playcanvas" && (
                    <button onClick={() => router.push("/wonder-build/playcanvas")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-lg shadow-cyan-600/50 flex items-center gap-2">Open in PlayCanvas</button>
                  )}
                  <button onClick={acceptToPuck} className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/50 flex items-center gap-2">Accept & Continue</button>
                  <button onClick={() => { setResult(null); setAgents({}); setError(null); }} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">Build again</button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden p-2">
                {viewMode === "preview" ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] rounded-lg border border-white/10 p-8 text-center">
                    {previewBlobUrl ? (
                      <a href={previewBlobUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-6 py-3 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition-colors">Open Preview in New Tab</a>
                    ) : (
                      <p className="text-white/20 text-sm">No preview available</p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto bg-[#0d0d16] rounded-lg border border-white/10 p-4">
                    <pre className="text-[10px] text-white/60 font-mono leading-relaxed whitespace-pre-wrap break-words">{result.code}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 text-center">
              {isBuilding ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-violet-500/50 animate-pulse" style={{ animationDelay: "0.3s" }} />
                    <div className="absolute inset-4 rounded-full bg-violet-600/20 flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/80 font-semibold">Agents are building...</p>
                    <p className="text-white/30 text-sm mt-1">This takes about 20-40 seconds</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="text-6xl mb-4">🪄</div>
                   <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Wonderbuild</h2>
                  <p className="text-white/40 text-sm leading-relaxed mb-6">Describe what you want to build. Three AI agents will collaborate -- an Architect to plan, a Builder to code, and a Reviewer to polish -- then your creation appears live.</p>
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