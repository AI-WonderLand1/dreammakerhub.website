"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Search,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Video,
  Image,
  Sparkles,
  Download,
  Layers,
  Zap,
  Radio,
  VideoIcon,
  Sliders,
  Wand2,
} from "lucide-react";
import StudioViewport, { type StudioViewportHandle } from "@/components/studio/StudioViewport";
import type { GeneratedScene } from "@/lib/scene/generateScene";
import { logger } from "@/lib/logger";

type AiMode = "video" | "real" | "text";

const SAMPLE_ASSETS = [
  "Chair_Vintage_04",
  "Futuristic_Desk_A",
  "Cyber_Helmet_Mesh",
  "SciFi_Crate_LP",
];

const SAMPLE_MEDIA = [
  { icon: Video, name: "scan_office_loop.mp4" },
  { icon: Image, name: "vintage_chair_front.jpg" },
];

const PIPELINE_STAGES = [
  "Extracting keyframes",
  "Estimating depth",
  "Building point cloud",
  "Remeshing surface",
  "Baking textures",
];

export default function Studio3DFactory() {
  const viewportRef = useRef<StudioViewportHandle>(null);
  const [aiMode, setAiMode] = useState<AiMode>("text");
  const [prompt, setPrompt] = useState("a futuristic city at night with glowing skyscrapers");
  const [sourceFile, setSourceFile] = useState<string | null>(null);
  const [meshQuality, setMeshQuality] = useState("High");
  const [polyCount, setPolyCount] = useState("Mid");
  const [textureRes, setTextureRes] = useState("2K");
  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<{ name: string; id: string } | null>(null);
  const [scene, setScene] = useState<GeneratedScene | null>(null);
  const [status, setStatus] = useState("Idle");
  const [timelineSeconds, setTimelineSeconds] = useState(0);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2 + Math.random() * 4;
        if (next >= 100) {
          setStageIndex(0);
          return 100;
        }
        setStageIndex(Math.min(PIPELINE_STAGES.length - 1, Math.floor(next / 20)));
        return next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [generating]);

  const handleSelect = useCallback((selection: { name: string; id: string }) => {
    setSelected(selection);
  }, []);

  const runGenerate = useCallback(async () => {
    setGenerating(true);
    setStatus("Processing...");
    setProgress(0);
    setStageIndex(0);

    try {
      const res = await fetch("/api/3d/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiMode === "text" ? prompt : prompt || sourceFile || "generated scene",
          mode: aiMode,
          meshQuality,
          polyCount,
          textureRes,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Generation failed");

      setScene(data.scene);
      viewportRef.current?.renderScene(data.scene);
      setStatus("Complete");
    } catch (err: any) {
      logger.error("Generate 3D scene error:", err);
      setStatus("Failed");
    } finally {
      setProgress(100);
      setGenerating(false);
    }
  }, [aiMode, prompt, sourceFile, meshQuality, polyCount, textureRes]);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    setSourceFile(file.name);
    setStatus(`Source loaded: ${file.name}`);
  }, []);

  const resetScene = useCallback(() => {
    viewportRef.current?.clearScene();
    setScene(null);
    setSelected(null);
    setStatus("Idle");
  }, []);

  const exportScene = useCallback(() => {
    if (!scene) return;
    const blob = new Blob([JSON.stringify(scene, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scene.name.toLowerCase().replace(/\s+/g, "_") || "scene"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [scene]);

  const stageLabel = PIPELINE_STAGES[stageIndex] ?? "Processing";

  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Asset Explorer */}
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search generated assets..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-slate-700 placeholder-slate-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">My 3D Models</span>
            <div className="space-y-1">
              {SAMPLE_ASSETS.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/40 hover:bg-slate-900 hover:border-slate-700 cursor-pointer transition"
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <Box size={14} className="text-cyan-400 shrink-0" />
                    <span className="text-xs truncate text-slate-300 font-mono">{item}.gltf</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">Mesh</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">Raw Media Sources</span>
            <div className="space-y-1">
              {SAMPLE_MEDIA.map((m, i) => (
                <div key={i} className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/30 text-slate-400 text-xs font-mono">
                  <m.icon size={12} />
                  <span>{m.name}</span>
                </div>
              ))}
              {sourceFile && (
                <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 text-xs font-mono">
                  <Upload size={12} />
                  <span>{sourceFile}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col bg-slate-900 relative min-w-0 pb-12">
        <StudioViewport ref={viewportRef} onSelect={handleSelect} className="flex-1" />

        {/* Live media preview overlay */}
        {generating && (
          <div className="absolute bottom-4 left-4 right-4 h-28 bg-slate-950/90 backdrop-blur rounded-xl border border-slate-800 p-3 flex flex-col z-10">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
              <div className="flex items-center space-x-2">
                <Radio size={12} className="text-red-500 animate-pulse" />
                <span>LIVE AI {aiMode.toUpperCase()} PIPELINE</span>
              </div>
              <span>{stageLabel} — {Math.round(progress)}%</span>
            </div>
            <div className="flex-1 bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 absolute left-0 top-0 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
              <span className="text-xs font-mono text-slate-500 flex items-center space-x-2">
                <VideoIcon size={14} />
                <span>{stageLabel.toLowerCase()} from {sourceFile || prompt || "source"}...</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right AI Generator Control Board */}
      <div className="w-72 border-l border-slate-800 bg-slate-950 p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5 flex items-center gap-1">
            <Zap size={11} /> Engine Strategy
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "text" as AiMode, icon: Sparkles, label: "Text" },
                { id: "video" as AiMode, icon: Video, label: "Video" },
                { id: "real" as AiMode, icon: Image, label: "Photo" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAiMode(mode.id)}
                className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center transition ${
                  aiMode === mode.id
                    ? "bg-blue-950/40 border-blue-500 text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <mode.icon size={15} className={aiMode === mode.id ? "text-blue-400" : "text-slate-500"} />
                <span className="text-[10px] font-bold mt-1.5 uppercase">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Source input */}
        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5">Source Input</span>
          {aiMode === "text" ? (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe a scene, object, or world..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-700 placeholder-slate-500 resize-none"
            />
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 w-full bg-slate-900/60 border border-dashed border-slate-700 rounded-xl p-4 cursor-pointer hover:border-cyan-700 transition">
              <Upload size={18} className="text-slate-500" />
              <span className="text-[11px] text-slate-400 font-mono">
                {sourceFile ? sourceFile : aiMode === "video" ? "Drag & drop video" : "Drag & drop image"}
              </span>
              <input type="file" className="hidden" accept={aiMode === "video" ? "video/*" : "image/*"} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
          )}
        </div>

        {/* Generation config */}
        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5 flex items-center gap-1">
            <Sliders size={11} /> Generation Config
          </span>
          <div className="space-y-3">
            <ConfigRow label="Mesh Quality" value={meshQuality} onChange={setMeshQuality} options={["High", "Medium", "Low"]} />
            <ConfigRow label="Poly Count" value={polyCount} onChange={setPolyCount} options={["High", "Mid", "Low"]} />
            <ConfigRow label="Texture Res" value={textureRes} onChange={setTextureRes} options={["4K", "2K", "1K"]} />
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={runGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-blue-900/30"
          >
            <Wand2 size={14} />
            {generating ? "Generating..." : `Generate ${aiMode === "text" ? "Scene" : "Mesh"}`}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={exportScene}
              disabled={!scene}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-2 rounded-lg text-[11px] font-semibold transition"
            >
              <Download size={13} /> Export
            </button>
            <button
              onClick={resetScene}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-[11px] font-semibold transition"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {selected && (
          <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/30 p-3">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase block mb-1.5">Selection</span>
            <p className="text-xs text-slate-200 font-mono truncate">{selected.name}</p>
            <p className="text-[10px] text-slate-500 font-mono truncate">{selected.id}</p>
          </div>
        )}
      </div>

      {/* Bottom timeline bar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-950/95 backdrop-blur border-t border-slate-800 flex items-center px-4 gap-4 z-20 pointer-events-none">
        <button className="pointer-events-auto flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md">
          <Play size={12} /> Play
        </button>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${generating ? "bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200" : "bg-cyan-600/50"} rounded-full`}
            style={{ width: `${generating ? progress : (timelineSeconds / 30) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
          {Math.floor(timelineSeconds / 60)}:{String(timelineSeconds % 60).padStart(2, "0")} / 00:30
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 whitespace-nowrap">
          <Layers size={11} className="text-cyan-400" /> STATUS: <span className={generating ? "text-amber-400" : selected ? "text-cyan-300" : "text-emerald-400"}>{status.toUpperCase()}</span>
        </span>
      </div>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
