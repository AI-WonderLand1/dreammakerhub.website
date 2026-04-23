"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { htmlToPuckBlocks, storePuckData } from "@/lib/ai-to-puck";
import { AssetLibrary } from "@/components/ai/AssetLibrary";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Layers, Plus, Monitor, Settings, CreditCard, Users, LogOut, ChevronDown, Edit3, Eye, Code, Mic, Image, Undo, RotateCcw, Wand2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { ConfessionsOverlay } from "./components/ConfessionsOverlay";

type BuildType = "website" | "game" | "component" | "3d-assets";
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
};

export default function AIBuilderPage() {
  const router = useRouter();
  const { signOut: authSignOut } = useAuth();
  const [buildType, setBuildType] = useState<BuildType>("website");
  const [prompt, setPrompt] = useState("");
  const [agents, setAgents] = useState<Partial<Record<AgentStage, AgentEvent>>>({});
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "code">("edit");
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [droppedAssets, setDroppedAssets] = useState<string[]>([]);
  const [history, setHistory] = useState<{code: string; timestamp: number}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [confession, setConfession] = useState<{message: string; type: string} | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleAssetDrop = useCallback((asset: any) => {
    setDroppedAssets(prev => [...prev, asset.id]);
    // Add the asset to the current prompt
    setPrompt(prev => `${prev} Include ${asset.name} ${asset.type}`);
  }, []);

  const acceptToPuck = useCallback(() => {
    if (!result?.code) return;
    try {
      const puckData = htmlToPuckBlocks(result.code);
      const dataKey = storePuckData(puckData);
      router.push(`/wonder-build/puck?ai_data=${dataKey}`);
    } catch (err) {
      console.error("[AI Builder] Failed to accept to Puck:", err);
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
            setHistory(prev => [...prev.slice(0, historyIndex + 1), { code: data.code, timestamp: Date.now() }]);
            setHistoryIndex(prev => prev + 1);
          } else if (eventName === "confession") {
            setConfession({ message: data.message, type: data.type });
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
  const undoCode = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setResult({ ...result!, code: prev.code });
      setHistoryIndex(prev => prev - 1);
    }
  };
  const restoreCode = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setResult({ ...result!, code: next.code });
      setHistoryIndex(prev => prev + 1);
    }
  };
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
      console.error("Failed to save project:", err);
      alert("Failed to save project. Please try again.");
    } finally { setSaving(false); }
  }, [result, buildType, prompt, router, saving]);

  const handleSignOut = async () => {
    try {
      await authSignOut();
      router.push('/');
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const isBuilding = running;
  const isDone = !!result;
  const hasStarted = Object.keys(agents).length > 0 || isDone || !!error;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <header className="border-b border-white/10 px-4 py-3 flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-all outline-none">
            <div className="bg-purple-600 p-1.5 rounded-md">
              <Layers size={18} className="text-white" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[13px] font-bold text-white">Wonder Build</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Pro Plan</span>
            </div>
            <ChevronDown size={14} className="text-gray-500 ml-1" />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64 bg-[#0a0a0b] border-gray-800 text-white shadow-2xl ml-2">
            <DropdownMenuLabel className="text-[10px] text-gray-500 uppercase py-2">Workspace</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => router.push('/wonder-build')} className="gap-3 py-3 focus:bg-violet-500/10 cursor-pointer">
              <Monitor size={16} className="text-gray-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Your projects</span>
                <span className="text-[10px] text-gray-500">Manage all web apps</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push('/wonder-build/ai-builder')} className="gap-3 py-3 focus:bg-violet-500/10 cursor-pointer">
              <Plus size={16} className="text-gray-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Create new website</span>
                <span className="text-[10px] text-gray-500">Launch a fresh AI dream</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push('/wonder-build/puck')} className="gap-3 py-3 focus:bg-violet-500/10 cursor-pointer">
              <Layers size={16} className="text-gray-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Puck Layouts</span>
                <span className="text-[10px] text-gray-500">Drag & drop editor</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-gray-800" />
            
            <DropdownMenuLabel className="text-[10px] text-gray-500 uppercase py-2">Management</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="gap-3 py-2 focus:bg-white/5">
              <Settings size={16} /> <span className="text-sm">Account settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings/billing')} className="gap-3 py-2 focus:bg-white/5">
              <CreditCard size={16} /> <span className="text-sm">Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings/team')} className="gap-3 py-2 focus:bg-white/5">
              <Users size={16} /> <span className="text-sm">Team</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem onClick={handleSignOut} className="gap-3 py-2 focus:bg-white/5 text-red-400 focus:text-red-400">
              <LogOut size={16} /> <span className="text-sm">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-white/20" />
        <nav className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
          <button onClick={() => setViewMode("edit")} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "edit" ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/10 hover:text-white"}`}>
            <Edit3 size={14} /> Edit
          </button>
          <button onClick={() => setViewMode("preview")} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "preview" ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/10 hover:text-white"}`}>
            <Eye size={14} /> Preview
          </button>
          <button onClick={() => setViewMode("code")} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "code" ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/10 hover:text-white"}`}>
            <Code size={14} /> Code
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/50">Gemini 2.0 Flash</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
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

              <div className="flex flex-col gap-6 pb-24">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest mb-3 block">Describe what you want</label>
                  <div className="relative">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runBuild(); }} placeholder={"Describe your " + buildType + "..."} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500 transition-colors pr-24" />
                    <button onClick={() => setPrompt(prev => prev + " Make it magical and visually stunning with modern animations and effects.")} className="absolute top-3 right-3 p-2 rounded-lg bg-gradient-to-r from-violet-600/20 to-blue-600/20 border border-violet-500/30 text-violet-400 hover:from-violet-600/30 hover:to-blue-600/30 transition-colors" title="Magic Fill - AI enhance">
                      <Wand2 size={14} />
                    </button>
                    <div className="absolute bottom-3 right-14 flex items-center gap-1">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Voice input">
                        <Mic size={16} />
                      </button>
                      <label className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer" title="Upload image">
                        <input type="file" accept="image/*" className="hidden" />
                        <Image size={16} />
                      </label>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                   {EXAMPLES[buildType].slice(0, 2).map((ex) => (
                     <button key={ex} onClick={() => setPrompt(ex)} className="text-[10px] text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-1 transition-colors text-left">
                       {ex.length > 50 ? ex.slice(0, 48) + "..." : ex}
                     </button>
                   ))}
                 </div>
                 
                 {buildType === "3d-assets" && (
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
              <div className="border-t border-white/10 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/50 uppercase tracking-widest">Working</p>
                  {historyIndex >= 0 && (
                    <div className="flex gap-1">
                      <button onClick={undoCode} disabled={historyIndex <= 0} className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <Undo size={12} />
                      </button>
                      <button onClick={restoreCode} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  )}
                </div>
                
                {isBuilding ? (
                  <div className="space-y-2">
                    {STAGE_ORDER.map((stage) => {
                      const ev = agents[stage];
                      const info = STAGE_INFO[stage];
                      const status: AgentStatus = ev?.status ?? "idle";
                      const isActive = status === "running";
                      const isDoneStage = status === "done";
                      return (
                        <div key={stage} className={"flex items-center gap-3 p-2 rounded-lg transition-all " + (isActive ? "bg-violet-500/10" : isDoneStage ? "bg-green-500/10" : "bg-white/5")}>
                          {isActive ? (
                            <Loader2 size={14} className="text-violet-400 animate-spin" />
                          ) : isDoneStage ? (
                            <CheckCircle2 size={14} className="text-green-400" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={"text-xs font-medium " + (isActive ? "text-violet-300" : isDoneStage ? "text-green-300" : "text-white/40")}>
                              {ev?.label ?? stage.charAt(0).toUpperCase() + stage.slice(1)}
                            </p>
                            {ev?.message && <p className="text-[10px] text-white/30 truncate">{ev.message}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {STAGE_ORDER.map((stage) => {
                      const ev = agents[stage];
                      const isDoneStage = ev?.status === "done";
                      return (
                        <div key={stage} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                          <CheckCircle2 size={14} className={isDoneStage ? "text-green-400" : "text-white/20"} />
                          <p className={"text-xs font-medium " + (isDoneStage ? "text-green-300" : "text-white/40")}>
                            {ev?.label ?? stage.charAt(0).toUpperCase() + stage.slice(1)}
                          </p>
                        </div>
                      );
                    })}
                    {result && !isBuilding && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10">
                        <CheckCircle2 size={14} className="text-green-400" />
                        <p className="text-xs font-medium text-green-300">Build Complete - {(result.code.length / 1024).toFixed(1)} KB</p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl p-3 border border-red-500/30 bg-red-500/5 flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-red-400 font-semibold">Build Error</p>
                      <p className="text-[11px] text-red-300/70 mt-0.5">{error}</p>
                    </div>
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
                  <button onClick={() => setViewMode("edit")} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 " + (viewMode === "edit" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => setViewMode("preview")} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 " + (viewMode === "preview" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>
                    <Eye size={14} /> Preview
                  </button>
                  <button onClick={() => setViewMode("code")} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 " + (viewMode === "code" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>
                    <Code size={14} /> Code
                  </button>
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={copyCode} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">Copy</button>
                  <button onClick={downloadFile} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">Download</button>
                  <button onClick={acceptProject} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/30">{saving ? "Saving..." : "Accept & Edit"}</button>
                  <button onClick={acceptToPuck} className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/50 flex items-center gap-2">Accept & Continue</button>
                  <button onClick={() => { setResult(null); setAgents({}); setError(null); }} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">Build again</button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden p-2">
                {viewMode === "edit" ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] rounded-lg border border-white/10 p-8">
                    <div className="text-center">
                      <div className="text-4xl mb-3">✨</div>
                      <h3 className="text-lg font-semibold text-white mb-2">AI-Generated Content Ready</h3>
                      <p className="text-sm text-white/40 mb-4 max-w-md">Click "Accept & Continue" to open in Puck editor for visual editing, or use Preview/Code modes to inspect the result.</p>
                      <button onClick={acceptToPuck} className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-900/30">
                        Open in Puck Editor
                      </button>
                    </div>
                  </div>
                ) : viewMode === "preview" ? (
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
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">AI Wonder Build</h2>
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
      {confession && (
        <ConfessionsOverlay
          message={confession.message}
          type={confession.type as "uncertainty" | "correction" | "limitation" | "success"}
          onDismiss={() => setConfession(null)}
        />
      )}
    </div>
  );
}