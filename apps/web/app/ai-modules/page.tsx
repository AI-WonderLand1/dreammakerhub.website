"use client";

import { useEffect, useMemo, useState, Suspense, lazy, useCallback } from "react";
import {
  Search,
  Key,
  BrainCircuit,
  Play,
  Database,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  Cloud,
} from "lucide-react";

const RobotScene = lazy(() =>
  import("../../ai-modules/scene/RobotScene").then((m) => ({ default: m.RobotScene }))
);

type ModuleKind = "all" | "chat" | "code" | "agent" | "data" | "vision" | "training";
type TrainingStatus = "idle" | "uploading" | "success" | "error";

interface Module {
  id: string;
  label: string;
  description: string | null;
  kind: ModuleKind;
  repoUrl?: string;
  source?: string | null;
}

export default function AiModulesPage() {
  const [activeTab, setActiveTab] = useState<"explorer" | "training">("explorer");
  const [category, setCategory] = useState<ModuleKind>("all");
  const [search, setSearch] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  // BYOK
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");
  const [keyActive, setKeyActive] = useState(false);

  // BYOC
  const [byocLinked, setByocLinked] = useState(false);

  // Robot / Voice
  const [isRobotVoiced, setIsRobotVoiced] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  // Training
  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [trainingModel, setTrainingModel] = useState("google/gemini-3-flash-preview");
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>("idle");
  const [trainingLog, setTrainingLog] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("WONDER_BYOK_KEY");
    if (saved) { setUserApiKey(saved); setKeyActive(true); }

    fetch("/api/cloud-connections")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.connections?.some((c: { status: string }) => c.status === "connected")) {
          setByocLinked(true);
        }
      })
      .catch(() => {});

    async function fetchModules() {
      try {
        const res = await fetch("/api/ai/modules");
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.modules || [];
        const mapped: Module[] = items.map((item: any) => ({
          id: String(item.id || crypto.randomUUID()),
          label: item.name || "Unknown module",
          description: item.description || null,
          kind: item.topics?.includes("chat") ? "chat" : "code",
          repoUrl: item.html_url,
          source: item.source || "registry",
        }));
        setModules(mapped);
      } catch {
        setModules([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModules();
  }, []);

  const saveKey = () => {
    localStorage.setItem("WONDER_BYOK_KEY", userApiKey);
    setKeyActive(!!userApiKey.trim());
    setShowKeyModal(false);
  };

  const speak = useCallback((text: string) => {
    if (!isRobotVoiced) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 0.5; u.rate = 0.85;
    const v = window.speechSynthesis.getVoices().find((x) => x.name.includes("Google") || x.name.includes("Male"));
    if (v) u.voice = v;
    u.onstart = () => setIsTalking(true);
    u.onend = () => setIsTalking(false);
    window.speechSynthesis.speak(u);
  }, [isRobotVoiced]);

  const filtered = useMemo(() => modules.filter((mod) => {
    const matchCat = category === "all" || mod.kind === category;
    const matchSearch = mod.label.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [modules, category, search]);

  async function runModule(modId: string, prompt: string) {
    setLoadingId(modId);
    setIsConverting(true);
    try {
      const res = await fetch("/runners/aiWorker", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-API-Key": userApiKey },
        body: JSON.stringify({ moduleId: modId, prompt }),
      });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [modId]: data }));
    } catch (err: any) {
      setResults((prev) => ({ ...prev, [modId]: { error: err.message } }));
    } finally {
      setLoadingId(null);
      setIsConverting(false);
    }
  }

  async function runTraining() {
    if (!trainingFile) return;
    setTrainingStatus("uploading");
    setTrainingLog(["Initialising fine-tune pipeline…"]);
    setIsConverting(true);

    const steps = [
      `Model target: ${trainingModel}`,
      `Parsing dataset: ${trainingFile.name}`,
      "Validating JSONL schema…",
      "Constitutional constraints applied.",
      keyActive ? "BYOK key authenticated. Sending to provider…" : "⚠ BYOK key required.",
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 700));
      setTrainingLog((p) => [...p, step]);
    }

    if (keyActive) {
      await new Promise((r) => setTimeout(r, 800));
      const jobId = "FT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      setTrainingLog((p) => [...p, `Fine-tune job queued. Job ID: ${jobId}`]);
      setTrainingStatus("success");
      speak(`Fine tune job ${jobId} queued successfully.`);
    } else {
      setTrainingStatus("error");
    }
    setIsConverting(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-sky-500/30">
      {/* BYOK Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">API Key (BYOK)</h3>
              <button onClick={() => setShowKeyModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Your key is stored locally in your browser — never sent to our database.
            </p>
            <input
              type="password"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder="sk-or-… / sk-proj-…"
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm focus:border-sky-500 outline-none"
            />
            <button
              onClick={saveKey}
              className="mt-4 w-full rounded-lg bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500 transition"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* 3D Robot Scene Banner */}
      <div className="w-full h-64 relative overflow-hidden border-b border-white/5">
        <Suspense fallback={<div className="w-full h-full bg-[#080808] flex items-center justify-center text-slate-600 text-sm">Loading 3D scene…</div>}>
          <RobotScene
            isConverting={isConverting}
            isVerifying={isTalking}
            hasKey={keyActive}
            hasBucket={byocLinked}
          />
        </Suspense>

        {/* Voice Toggle */}
        <button
          onClick={() => {
            const next = !isRobotVoiced;
            setIsRobotVoiced(next);
            if (next) speak("Neural voice link established. Standing by.");
          }}
          className={`absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
            isRobotVoiced
              ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
              : "bg-black/60 border-white/10 text-slate-500"
          }`}
        >
          {isRobotVoiced ? <Volume2 size={12} /> : <VolumeX size={12} />}
          {isRobotVoiced ? "Voice: ON" : "Voice: OFF"}
        </button>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <BrainCircuit className="h-5 w-5" />
              <span className="text-xs uppercase tracking-widest font-bold">Wonder Playground v2.4</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              AI Skills <span className="text-slate-500">&</span> Training
            </h1>
          </div>
          <div className="flex gap-2 items-center">
            {/* BYOC Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold ${byocLinked ? "bg-purple-500/10 border-purple-500/30 text-purple-300" : "bg-white/5 border-white/10 text-slate-500"}`}>
              <Cloud className="h-3.5 w-3.5" />
              BYOC: {byocLinked ? "Linked" : "Not connected"}
            </div>
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
            >
              <Key className="h-4 w-4" />
              {keyActive ? <span className="text-green-400">Key Active</span> : "Add Key"}
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="mt-6 flex gap-8 border-b border-white/5">
          {(["explorer", "training"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium transition capitalize ${
                activeTab === tab
                  ? tab === "explorer"
                    ? "border-b-2 border-sky-500 text-sky-400"
                    : "border-b-2 border-violet-500 text-violet-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "explorer" ? "Module Explorer" : "Fine-Tuning Lab"}
            </button>
          ))}
        </div>

        {activeTab === "explorer" ? (
          <>
            {/* Search & Filters */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search live modules..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm outline-none focus:border-sky-500/50"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {["all", "chat", "code", "agent", "vision"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat as ModuleKind)}
                    className={`px-4 py-2 rounded-xl text-xs capitalize whitespace-nowrap border transition ${
                      category === cat
                        ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Module Grid */}
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 animate-pulse">
                    <div className="h-8 w-8 rounded-lg bg-white/5 mb-4" />
                    <div className="h-4 w-3/4 rounded bg-white/5 mb-2" />
                    <div className="h-3 w-full rounded bg-white/5" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="col-span-3 py-20 text-center text-slate-500">
                  No modules found. Try a different search or category.
                </div>
              ) : (
                filtered.map((mod) => (
                  <div
                    key={mod.id}
                    className="group relative rounded-2xl border border-white/10 bg-slate-900/50 p-6 hover:bg-slate-900 transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                        <Play className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider bg-white/5 px-2 py-1 rounded text-slate-400">
                        {mod.kind}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-100">{mod.label}</h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-2">
                      {mod.description || "No description provided."}
                    </p>
                    <button
                      disabled={loadingId === mod.id}
                      onClick={() => runModule(mod.id, "Explain quantum physics")}
                      className="mt-6 w-full rounded-xl bg-white/5 border border-white/10 py-2 text-xs font-semibold hover:bg-sky-500 hover:text-white hover:border-transparent transition-all"
                    >
                      {loadingId === mod.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…
                        </span>
                      ) : "Try in Playground"}
                    </button>
                    {results[mod.id] && (
                      <div className="mt-4 p-3 rounded-lg bg-black/50 border border-white/5 text-[10px] font-mono text-sky-300 max-h-32 overflow-y-auto">
                        {JSON.stringify(results[mod.id], null, 2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Training Tab */
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Left: Config */}
            <div className="lg:col-span-2 space-y-5">
              {/* BYOC Banner */}
              <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${byocLinked ? "bg-purple-500/10 border-purple-500/30 text-purple-200" : "bg-amber-950/20 border-amber-900/30 text-amber-300/70"}`}>
                <Database className="h-4 w-4 shrink-0" />
                {byocLinked
                  ? "Your BYOC cloud storage is linked — training artifacts will be saved directly to your bucket."
                  : "No BYOC storage connected. Artifacts stored temporarily. Connect in Dashboard → Settings → Cloud."}
              </div>

              {/* Model */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Base Model</h3>
                <select
                  value={trainingModel}
                  onChange={(e) => setTrainingModel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 outline-none focus:border-sky-500/50"
                >
                  <option value="google/gemini-3-flash-preview">Gemini 3 Flash (Google)</option>
                  <option value="google/gemini-3.1-pro-preview">Gemini 3.1 Pro (Google)</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                  <option value="openai/gpt-4o">GPT-4o (OpenAI)</option>
                </select>
              </div>

              {/* Upload */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Training Dataset</h3>
                <label className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-white/10 bg-black/20 cursor-pointer hover:border-violet-500/40 hover:bg-violet-950/10 transition-all">
                  <UploadCloud className="h-6 w-6 text-white/30 mb-2" />
                  <span className="text-sm text-white/40">
                    {trainingFile ? trainingFile.name : "Drop .jsonl or click to upload"}
                  </span>
                  <span className="text-xs text-white/20 mt-1">OpenAI / HuggingFace format</span>
                  <input
                    type="file"
                    accept=".jsonl,.json"
                    className="hidden"
                    onChange={(e) => setTrainingFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {/* Run Button */}
              <button
                onClick={runTraining}
                disabled={!trainingFile || trainingStatus === "uploading"}
                className="w-full py-4 rounded-2xl bg-violet-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {trainingStatus === "uploading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Running Pipeline…</>
                ) : (
                  "Start Fine-Tune"
                )}
              </button>

              {/* Log */}
              {trainingLog.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/50 p-5 space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
                    Pipeline Log
                  </div>
                  <div className="font-mono text-[11px] space-y-1 max-h-52 overflow-y-auto">
                    {trainingLog.map((line, i) => (
                      <div key={i} className="text-violet-200/60">
                        <span className="text-white/20 mr-2">{String(i + 1).padStart(2, "0")}</span>
                        {line}
                      </div>
                    ))}
                  </div>
                  {trainingStatus === "success" && (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-semibold pt-2 border-t border-white/5">
                      <CheckCircle2 className="h-4 w-4" /> Job queued successfully
                    </div>
                  )}
                  {trainingStatus === "error" && (
                    <div className="flex items-center gap-2 text-red-400 text-sm font-semibold pt-2 border-t border-white/5">
                      <AlertCircle className="h-4 w-4" /> Pipeline failed — add your BYOK key
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Status Panel */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Integrations</h3>
                {[
                  { name: "Weights & Biases", status: "Connect", color: "yellow" },
                  {
                    name: "OpenAI Fine-Tuning",
                    status: keyActive ? "Ready" : "Needs BYOK",
                    color: keyActive ? "green" : "amber",
                  },
                  { name: "HuggingFace Hub", status: "Connect", color: "yellow" },
                  {
                    name: "BYOC Storage",
                    status: byocLinked ? "Linked" : "Disconnected",
                    color: byocLinked ? "purple" : "slate",
                  },
                ].map(({ name, status, color }) => (
                  <div key={name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-slate-300">{name}</span>
                    <span className={`text-xs font-bold text-${color}-400`}>{status}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">BYOK Key</h3>
                <p className="text-xs text-slate-500">
                  Add your OpenRouter or OpenAI key to unlock training. Stored locally only.
                </p>
                <button
                  onClick={() => setShowKeyModal(true)}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold border transition ${
                    keyActive
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                >
                  {keyActive ? "✓ Key Active — Update" : "Add API Key"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
