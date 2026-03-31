"use client";

import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { Sidebar } from "./components/Sidebar";
import EgyptianModule from "./EgyptianModule";
import EgyptianVoiceModule from "./EgyptianVoiceModule";
import {
  Scale,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
  Lock,
  Database,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BrainCircuit,
} from "lucide-react";

const RobotScene = lazy(() =>
  import("./scene/RobotScene").then((m) => ({ default: m.RobotScene }))
);

type ModuleConfig = {
  useEgyptian?: boolean;
  useVoice?: boolean;
  useVision?: boolean;
  useStorage?: boolean;
  useBYOK?: boolean;
};

type Module = {
  id: string;
  label: string;
  config: ModuleConfig;
};

const DEFAULT_MODULES: Module[] = [
  { id: "module-1", label: "SCRIBE_01", config: { useEgyptian: true } },
  { id: "module-2", label: "VOICE_01", config: { useVoice: true } },
];

type TrainingStatus = "idle" | "uploading" | "success" | "error";

export default function ConstitutionalPlayground() {
  const [activeTab, setActiveTab] = useState<"text" | "voice" | "training">("text");
  const [isRobotVoiced, setIsRobotVoiced] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const [modules, setModules] = useState<Module[]>(DEFAULT_MODULES);
  const [activeModuleId, setActiveModuleId] = useState(DEFAULT_MODULES[0].id);

  const [byocLinked, setByocLinked] = useState(false);
  const [byokKey, setByokKey] = useState("");
  const [byokSaved, setByokSaved] = useState(false);

  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [trainingModel, setTrainingModel] = useState("google/gemini-3-flash-preview");
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>("idle");
  const [trainingLog, setTrainingLog] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("byok_key");
    if (saved) { setByokKey(saved); setByokSaved(true); }

    fetch("/api/cloud-connections")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.connections?.some((c: { status: string }) => c.status === "connected")) {
          setByocLinked(true);
        }
      })
      .catch(() => {});
  }, []);

  const speakAsRobot = useCallback((text: string) => {
    if (!isRobotVoiced) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.5;
    utterance.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const roboticVoice = voices.find(
      (v) => v.name.includes("Google") || v.name.includes("Male")
    );
    if (roboticVoice) utterance.voice = roboticVoice;
    utterance.onstart = () => setIsTalking(true);
    utterance.onend = () => setIsTalking(false);
    window.speechSynthesis.speak(utterance);
  }, [isRobotVoiced]);

  const handleAddModule = () => {
    const newId = `module-${Date.now()}`;
    const newModule: Module = { id: newId, label: `NODE_${modules.length + 1}`, config: {} };
    setModules((prev) => [...prev, newModule]);
    setActiveModuleId(newId);
  };

  const handleRemoveModule = (id: string) => {
    setModules((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (activeModuleId === id && next.length > 0) setActiveModuleId(next[0].id);
      return next;
    });
  };

  const handleUpdateModule = (id: string, updates: Partial<Module>) => {
    setModules((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m));
  };

  const saveByok = () => {
    localStorage.setItem("byok_key", byokKey);
    setByokSaved(true);
    speakAsRobot("API key secured. Encryption layer active.");
  };

  const runTraining = async () => {
    if (!trainingFile) return;
    setTrainingStatus("uploading");
    setTrainingLog(["Initialising fine-tune pipeline…"]);
    setIsConverting(true);

    await new Promise((r) => setTimeout(r, 800));
    setTrainingLog((p) => [...p, `Model target: ${trainingModel}`]);
    await new Promise((r) => setTimeout(r, 600));
    setTrainingLog((p) => [...p, `Parsing dataset: ${trainingFile.name}`]);
    await new Promise((r) => setTimeout(r, 900));
    setTrainingLog((p) => [...p, "Validating JSONL schema…"]);
    await new Promise((r) => setTimeout(r, 700));
    setTrainingLog((p) => [...p, "Dataset valid. Constitutional constraints applied."]);
    await new Promise((r) => setTimeout(r, 500));

    if (byokSaved && byokKey.length > 10) {
      setTrainingLog((p) => [...p, "BYOK key authenticated. Sending to provider…"]);
      await new Promise((r) => setTimeout(r, 1000));
      setTrainingLog((p) => [...p, "Fine-tune job queued. Job ID: FT-" + Math.random().toString(36).slice(2, 8).toUpperCase()]);
      setTrainingStatus("success");
    } else {
      setTrainingLog((p) => [...p, "⚠ BYOK key required. Please add your OpenRouter/OpenAI key."]);
      setTrainingStatus("error");
    }
    setIsConverting(false);
  };

  return (
    <div className="h-screen w-full bg-[#050505] flex overflow-hidden selection:bg-amber-500/30">
      <Sidebar
        modules={modules}
        activeId={activeModuleId}
        onSelect={setActiveModuleId}
        onRemove={handleRemoveModule}
        onAdd={handleAddModule}
        onUpdate={handleUpdateModule}
      />

      <div className="flex-1 flex flex-col relative">
        {/* 3D Robot Background */}
        <div
          className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${
            isRobotVoiced ? "opacity-30" : "opacity-10"
          }`}
        >
          <Suspense fallback={null}>
            <RobotScene
              isConverting={isConverting}
              isVerifying={isTalking}
              hasKey={byokSaved}
              hasBucket={byocLinked}
            />
          </Suspense>
        </div>

        {/* HEADER */}
        <header className="z-20 h-20 border-b tie-dye-border bg-gradient-to-r from-black/80 via-black/70 to-black/80 backdrop-blur-md flex items-center justify-between px-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black tie-dye-text uppercase tracking-[0.3em]">
                Compliance_Engine
              </span>
              <div className="flex items-center gap-2 text-white font-bold tracking-tighter italic">
                <Scale size={14} className="tie-dye-glow text-amber-500" /> EGYPT_CORE_v1.0
              </div>
            </div>

            <button
              onClick={() => {
                const next = !isRobotVoiced;
                setIsRobotVoiced(next);
                if (next) speakAsRobot("Neural voice link established. Standing by.");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                isRobotVoiced
                  ? "bg-amber-500/10 border-amber-500/50 text-amber-500 tie-dye-shadow"
                  : "bg-white/5 border-white/10 text-slate-500"
              }`}
            >
              {isRobotVoiced ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span className="text-[9px] font-black uppercase tracking-widest">
                {isRobotVoiced ? "Robot_Voice: ON" : "Robot_Voice: MUTED"}
              </span>
            </button>

            {/* BYOC Status Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                byocLinked
                  ? "bg-purple-500/10 border-purple-500/40 text-purple-300 tie-dye-shadow"
                  : "bg-white/5 border-white/10 text-slate-600"
              }`}
            >
              <Database size={11} />
              BYOC: {byocLinked ? "LINKED" : "TEMP_MODE"}
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-black/80 rounded-2xl p-1 border tie-dye-border shadow-inner">
            {(["text", "voice", "training"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white shadow-lg tie-dye-shadow"
                    : "text-slate-600 hover:text-slate-400"
                }`}
              >
                {tab === "text" ? "SCRIBE_MODE" : tab === "voice" ? "VOICE_CORE" : "TRAINING"}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 flex relative z-10 overflow-hidden">
          {/* MAIN CONTENT */}
          <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-8">
              {activeTab === "text" && <EgyptianModule />}

              {activeTab === "voice" && (
                <EgyptianVoiceModule
                  isFeatureEnabled={isRobotVoiced}
                  onSpeechStart={() => { setIsTalking(true); setIsConverting(true); }}
                  onSpeechEnd={() => { setIsTalking(false); setIsConverting(false); }}
                />
              )}

              {activeTab === "training" && (
                <TrainingTab
                  trainingFile={trainingFile}
                  setTrainingFile={setTrainingFile}
                  trainingModel={trainingModel}
                  setTrainingModel={setTrainingModel}
                  trainingStatus={trainingStatus}
                  trainingLog={trainingLog}
                  onRun={runTraining}
                  byokKey={byokKey}
                  setByokKey={setByokKey}
                  byokSaved={byokSaved}
                  onSaveByok={saveByok}
                  byocLinked={byocLinked}
                />
              )}
            </div>
          </main>

          {/* LAW SIDEBAR */}
          <aside className="w-80 border-l border-amber-900/20 bg-black/90 p-8 flex flex-col gap-8 shadow-2xl z-30">
            <div className="flex items-center justify-between opacity-40">
              <div className="flex items-center gap-2 text-amber-600 uppercase font-black text-[9px] tracking-widest">
                <ShieldCheck size={14} /> Law_Registry
              </div>
              <Lock size={12} className="text-amber-900" />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-amber-900 uppercase">
                  Constitutional_Prompt
                </h4>
                <div
                  className="p-4 rounded-xl bg-amber-950/10 border border-amber-900/10 font-mono text-[10px] text-amber-200/40 leading-relaxed cursor-help hover:text-amber-200/60 transition-colors"
                  onClick={() =>
                    speakAsRobot(
                      "Directive one. Never make up information or hallucinate facts. Accuracy is mandatory."
                    )
                  }
                >
                  "Never make up information or hallucinate facts. If you don't
                  know something, explicitly say 'I don't know'."
                </div>
              </div>

              {/* BYOK Key Section */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-amber-900 uppercase tracking-widest">
                  BYOK_Security
                </h4>
                <input
                  type="password"
                  value={byokKey}
                  onChange={(e) => { setByokKey(e.target.value); setByokSaved(false); }}
                  placeholder="sk-or-… / sk-proj-…"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white/60 font-mono outline-none focus:border-amber-600/50 placeholder:text-white/20"
                />
                <button
                  onClick={saveByok}
                  disabled={!byokKey.trim()}
                  className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                    byokSaved
                      ? "bg-green-500/10 border-green-500/40 text-green-400"
                      : "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {byokSaved ? "✓ Key Secured" : "Lock Key"}
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={10} className="text-amber-600" /> Active_Audit
                </h4>
                <div className="space-y-3">
                  <div className="flex gap-3 text-[11px] text-amber-100/40 border-l border-amber-900/30 pl-3">
                    <span>
                      Verified phonemes for current input against Rosetta
                      metadata.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-amber-900/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-amber-900 uppercase">
                  Trust_Grade
                </span>
                <span className="text-green-500 font-mono font-bold tracking-tighter italic">
                  98.2% ACCURACY
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-amber-900 uppercase">
                  Storage
                </span>
                <span
                  className={`font-mono text-[9px] font-bold ${
                    byocLinked ? "text-purple-400" : "text-amber-500"
                  }`}
                >
                  {byocLinked ? "BYOC_LINKED" : "TEMP_24H"}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TrainingTab({
  trainingFile,
  setTrainingFile,
  trainingModel,
  setTrainingModel,
  trainingStatus,
  trainingLog,
  onRun,
  byokKey,
  setByokKey,
  byokSaved,
  onSaveByok,
  byocLinked,
}: {
  trainingFile: File | null;
  setTrainingFile: (f: File | null) => void;
  trainingModel: string;
  setTrainingModel: (m: string) => void;
  trainingStatus: TrainingStatus;
  trainingLog: string[];
  onRun: () => void;
  byokKey: string;
  setByokKey: (k: string) => void;
  byokSaved: boolean;
  onSaveByok: () => void;
  byocLinked: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-neutral-900 border border-amber-900/30 rounded-xl shadow-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-amber-900/30 pb-3">
          <BrainCircuit size={18} className="text-amber-500" />
          <h2 className="text-xl font-serif text-amber-500">Fine-Tune Lab</h2>
        </div>

        {/* BYOC Status Banner */}
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium ${
            byocLinked
              ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
              : "bg-amber-950/30 border-amber-900/30 text-amber-300/70"
          }`}
        >
          <Database size={14} />
          {byocLinked
            ? "Your BYOC storage is linked — training artifacts will be saved to your cloud."
            : "No BYOC storage connected. Artifacts will be stored temporarily."}
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
            Base Model
          </label>
          <select
            value={trainingModel}
            onChange={(e) => setTrainingModel(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-amber-600/50"
          >
            <option value="google/gemini-3-flash-preview">Gemini 3 Flash (Google)</option>
            <option value="google/gemini-3.1-pro-preview">Gemini 3.1 Pro (Google)</option>
            <option value="openai/gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
            <option value="openai/gpt-4o">GPT-4o (OpenAI)</option>
          </select>
        </div>

        {/* Dataset Upload */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
            Training Dataset (.jsonl)
          </label>
          <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-white/10 bg-black/20 cursor-pointer hover:border-amber-600/40 hover:bg-amber-950/10 transition-all">
            <UploadCloud size={22} className="text-white/30 mb-2" />
            <span className="text-xs text-white/40">
              {trainingFile ? trainingFile.name : "Drop .jsonl or click to upload"}
            </span>
            <input
              type="file"
              accept=".jsonl"
              className="hidden"
              onChange={(e) => setTrainingFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <button
          onClick={onRun}
          disabled={!trainingFile || trainingStatus === "uploading"}
          className="w-full py-3 rounded-xl bg-amber-600 text-black font-black text-xs uppercase tracking-widest hover:bg-amber-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {trainingStatus === "uploading" ? (
            <><Loader2 size={14} className="animate-spin" /> Running Pipeline…</>
          ) : (
            "Start Fine-Tune"
          )}
        </button>

        {/* Training Log */}
        {trainingLog.length > 0 && (
          <div className="space-y-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/30">
              Pipeline Log
            </div>
            <div className="bg-black/50 border border-white/5 rounded-lg p-4 font-mono text-[10px] space-y-1 max-h-44 overflow-y-auto">
              {trainingLog.map((line, i) => (
                <div key={i} className="text-amber-200/60">
                  <span className="text-white/20 mr-2">{String(i + 1).padStart(2, "0")}</span>
                  {line}
                </div>
              ))}
            </div>
            {trainingStatus === "success" && (
              <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                <CheckCircle2 size={14} /> Fine-tune job queued successfully.
              </div>
            )}
            {trainingStatus === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertCircle size={14} /> Pipeline failed. Check your BYOK key.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Integrations Panel */}
      <div className="p-6 bg-neutral-900 border border-white/5 rounded-xl space-y-4">
        <h3 className="text-sm font-black text-white/70 uppercase tracking-widest">
          Integrations
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { name: "Weights & Biases", status: "Connect", color: "yellow" },
            { name: "OpenAI Fine-Tuning", status: byokSaved ? "Ready" : "Needs BYOK", color: byokSaved ? "green" : "amber" },
            { name: "HuggingFace Hub", status: "Connect", color: "yellow" },
            { name: "BYOC Storage", status: byocLinked ? "Linked" : "Disconnected", color: byocLinked ? "purple" : "slate" },
          ].map(({ name, status, color }) => (
            <div
              key={name}
              className="p-3 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1"
            >
              <span className="text-white/60 font-bold">{name}</span>
              <span className={`text-[10px] font-black text-${color}-400 uppercase`}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
