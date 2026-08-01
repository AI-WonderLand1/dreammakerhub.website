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
  Save,
  FileJson,
  Loader2,
} from "lucide-react";
import StudioViewport, { type StudioViewportHandle, type StudioSelection } from "@/components/studio/StudioViewport";
import type { GeneratedScene } from "@/lib/scene/generateScene";
import { useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

type AiMode = "video" | "real" | "text";

type ProjectFile = { path: string; content: string; kind: "scene" | "glb" | "media" | "code" };

const PIPELINE_STAGES = [
  "Analyzing source",
  "Extracting keyframes",
  "Estimating depth",
  "Building point cloud",
  "Remeshing surface",
  "Baking textures",
];

function parseSceneContent(content: string): GeneratedScene | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.objects && Array.isArray(parsed.objects)) {
      return parsed as GeneratedScene;
    }
    return null;
  } catch {
    return null;
  }
}

export default function Studio3DFactory() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId")?.trim() || "default";

  const viewportRef = useRef<StudioViewportHandle>(null);
  const [aiMode, setAiMode] = useState<AiMode>("text");
  const [prompt, setPrompt] = useState("a futuristic city at night with glowing skyscrapers");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [meshQuality, setMeshQuality] = useState("High");
  const [polyCount, setPolyCount] = useState("Mid");
  const [textureRes, setTextureRes] = useState("2K");
  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<StudioSelection | null>(null);
  const [scene, setScene] = useState<GeneratedScene | null>(null);
  const [status, setStatus] = useState("Idle");
  const [elapsed, setElapsed] = useState(0);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProjectFiles = useCallback(async () => {
    setFilesLoading(true);
    setFilesError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`);
      if (!res.ok) throw new Error(`Failed to load project (${res.status})`);
      const data = await res.json();
      const entries = Object.entries(data.files ?? {}) as [string, string][];

      const files: ProjectFile[] = entries.map(([path, content]) => {
        const lower = path.toLowerCase();
        let kind: ProjectFile["kind"] = "code";
        if (lower.endsWith(".json") && parseSceneContent(content)) kind = "scene";
        else if (lower.endsWith(".glb") || lower.endsWith(".gltf")) kind = "glb";
        else if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".gif")) kind = "media";
        return { path, content, kind };
      });

      setProjectFiles(files);
    } catch (err: any) {
      setFilesError(err?.message ?? "Failed to load project files");
      logger.error("Load project files error:", err);
    } finally {
      setFilesLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProjectFiles();
  }, [loadProjectFiles]);

  const handleSelect = useCallback((selection: StudioSelection) => {
    setSelected(selection);
  }, []);

  const handleEntityCreated = useCallback((entity: { name: string; id: string }) => {
    setSelected({ name: entity.name, id: entity.id });
    setStatus(`Asset loaded: ${entity.name}`);
  }, []);

  const runGenerate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    setStatus("Processing...");
    setProgress(0);
    setStageIndex(0);
    setSavedPath(null);
    setElapsed(0);
    const startedAt = Date.now();
    elapsedTimerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);

    // Advance the pipeline stage as the request actually progresses
    const stageTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1.5 + Math.random() * 3;
        setStageIndex(Math.min(PIPELINE_STAGES.length - 1, Math.floor((next / 100) * PIPELINE_STAGES.length)));
        return Math.min(100, next);
      });
    }, 90);

    try {
      const res = await fetch("/api/3d/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode: aiMode,
          meshQuality,
          polyCount,
          textureRes,
          sourceName,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Generation failed");

      setScene(data.scene);
      viewportRef.current?.renderScene(data.scene);
      setProgress(100);
      setStageIndex(PIPELINE_STAGES.length - 1);
      setStatus("Complete");
    } catch (err: any) {
      setStatus("Failed");
      logger.error("Generate 3D scene error:", err);
    } finally {
      clearInterval(stageTimer);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      setGenerating(false);
      void loadProjectFiles();
    }
  }, [generating, prompt, aiMode, meshQuality, polyCount, textureRes, sourceName, loadProjectFiles]);

  const saveSceneToProject = useCallback(async () => {
    if (!scene) return;
    setSaving(true);
    setSavedPath(null);
    try {
      const slug = scene.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40) || "ai_scene";
      const fileName = `scenes/${slug}_${Date.now().toString(36)}.json`;
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: { [fileName]: JSON.stringify(scene, null, 2) } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save scene");
      }
      setSavedPath(fileName);
      setStatus("Saved to project");
      void loadProjectFiles();
    } catch (err: any) {
      setStatus("Save failed");
      logger.error("Save scene error:", err);
    } finally {
      setSaving(false);
    }
  }, [scene, projectId, loadProjectFiles]);

  const loadSceneFile = useCallback(
    (file: ProjectFile) => {
      const parsed = parseSceneContent(file.content);
      if (parsed) {
        setScene(parsed);
        setPrompt(parsed.description?.replace(/^Procedurally generated .* from prompt: "/, "").replace(/"$/, "") || prompt);
        viewportRef.current?.renderScene(parsed);
        setStatus(`Loaded ${file.path}`);
      }
    },
    [prompt],
  );

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    setSourceFile(file);
    setSourceName(file.name);
    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    setSourcePreviewUrl(URL.createObjectURL(file));
    setStatus(`Source loaded: ${file.name}`);
  }, [sourcePreviewUrl]);

  const resetScene = useCallback(() => {
    viewportRef.current?.clearScene();
    setScene(null);
    setSelected(null);
    setStatus("Idle");
    setSavedPath(null);
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

  const scenes = projectFiles.filter((f) => f.kind === "scene" && f.path.toLowerCase().includes(filter.toLowerCase()));
  const mediaFiles = projectFiles.filter((f) => f.kind === "media");
  const glbFiles = projectFiles.filter((f) => f.kind === "glb");

  const stageLabel = PIPELINE_STAGES[stageIndex] ?? "Processing";
  const isVideo = sourceFile?.type.startsWith("video/");
  const isImage = sourceFile?.type.startsWith("image/");

  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Asset Explorer */}
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search assets..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-slate-700 placeholder-slate-500"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
            <span>Project: {projectId.slice(0, 8)}</span>
            <button onClick={() => void loadProjectFiles()} className="text-slate-500 hover:text-cyan-400 transition" title="Refresh">
              <RotateCcw size={11} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filesLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" /> Loading project files...</div>
          ) : filesError ? (
            <p className="text-xs text-red-400">{filesError}</p>
          ) : (
            <>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">Saved Scenes</span>
                {scenes.length === 0 ? (
                  <p className="text-[11px] text-slate-600 font-mono">No scenes yet — generate one and save it.</p>
                ) : (
                  <div className="space-y-1">
                    {scenes.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => loadSceneFile(item)}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/40 hover:bg-slate-900 hover:border-cyan-700/60 cursor-pointer transition text-left"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <FileJson size={13} className="text-cyan-400 shrink-0" />
                          <span className="text-xs truncate text-slate-300 font-mono">{item.path.split("/").pop()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {glbFiles.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">3D Models</span>
                  <div className="space-y-1">
                    {glbFiles.map((item) => (
                      <div key={item.path} className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/30 text-slate-400 text-xs font-mono">
                        <Box size={12} className="text-blue-400" />
                        <span className="truncate">{item.path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">Raw Media Sources</span>
                {mediaFiles.length === 0 && !sourceFile ? (
                  <p className="text-[11px] text-slate-600 font-mono">Upload a video or photo for Real-to-3D.</p>
                ) : (
                  <div className="space-y-1">
                    {mediaFiles.map((m) => (
                      <div key={m.path} className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/30 text-slate-400 text-xs font-mono">
                        {m.path.endsWith(".mp4") || m.path.endsWith(".webm") || m.path.endsWith(".mov") ? <Video size={12} /> : <Image size={12} />}
                        <span className="truncate">{m.path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col bg-slate-900 relative min-w-0 pb-12">
        <StudioViewport ref={viewportRef} onSelect={handleSelect} onEntityCreated={handleEntityCreated} className="flex-1" />

        {/* Live media preview overlay */}
        {generating && (
          <div className="absolute bottom-4 left-4 right-4 h-28 bg-slate-950/90 backdrop-blur rounded-xl border border-slate-800 p-3 flex flex-col z-10">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
              <div className="flex items-center space-x-2">
                <Radio size={12} className="text-red-500 animate-pulse" />
                <span>LIVE AI {aiMode.toUpperCase()} PIPELINE</span>
              </div>
              <span>{stageLabel} — {Math.round(progress)}% · {elapsed}s</span>
            </div>
            <div className="flex-1 bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 absolute left-0 top-0 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
              {sourcePreviewUrl && (isVideo || isImage) ? (
                isVideo ? (
                  <video src={sourcePreviewUrl} autoPlay muted loop className="absolute inset-0 h-full w-full object-contain" />
                ) : (
                  <img src={sourcePreviewUrl} alt="source" className="absolute inset-0 h-full w-full object-contain" />
                )
              ) : (
                <span className="text-xs font-mono text-slate-500 flex items-center space-x-2">
                  <VideoIcon size={14} />
                  <span>{stageLabel.toLowerCase()} from {sourceName || prompt || "source"}...</span>
                </span>
              )}
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
                {sourceName ? sourceName : aiMode === "video" ? "Drag & drop video" : "Drag & drop image"}
              </span>
              <input
                type="file"
                className="hidden"
                accept={aiMode === "video" ? "video/*" : "image/*"}
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
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
            disabled={generating || (aiMode !== "text" && !sourceFile)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-blue-900/30"
          >
            <Wand2 size={14} />
            {generating ? "Generating..." : `Generate ${aiMode === "text" ? "Scene" : "Mesh"}`}
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={saveSceneToProject}
              disabled={!scene || saving}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-2 py-2 rounded-lg text-[11px] font-semibold transition"
              title="Save to project"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
            </button>
            <button
              onClick={exportScene}
              disabled={!scene}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-2 py-2 rounded-lg text-[11px] font-semibold transition"
              title="Download JSON"
            >
              <Download size={13} /> Export
            </button>
            <button
              onClick={resetScene}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-2 rounded-lg text-[11px] font-semibold transition"
              title="Clear viewport"
            >
              <RotateCcw size={13} /> Clear
            </button>
          </div>
          {savedPath && (
            <p className="text-[10px] font-mono text-emerald-400 break-all">✓ saved {savedPath}</p>
          )}
        </div>

        {selected && (
          <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/30 p-3">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase block mb-1.5">Selection</span>
            <p className="text-xs text-slate-200 font-mono truncate">{selected.name || "—"}</p>
            {selected.id && <p className="text-[10px] text-slate-500 font-mono truncate">{selected.id}</p>}
          </div>
        )}
      </div>

      {/* Bottom timeline bar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-950/95 backdrop-blur border-t border-slate-800 flex items-center px-4 gap-4 z-20">
        <button
          onClick={() => {
            if (scene) viewportRef.current?.animateCameraPath({ enabled: true, speed: 1, radius: 9, targetY: 1 });
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition"
          title="Orbit camera"
        >
          <Play size={12} /> Orbit
        </button>
        <button
          onClick={() => viewportRef.current?.animateCameraPath({ enabled: false })}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition"
        >
          <Pause size={12} /> Stop
        </button>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${generating ? "bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150" : "bg-cyan-600/50"} rounded-full`}
            style={{ width: `${generating ? progress : 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 whitespace-nowrap">
          <Layers size={11} className="text-cyan-400" /> STATUS:{" "}
          <span className={generating ? "text-amber-400" : selected?.id ? "text-cyan-300" : savedPath ? "text-emerald-400" : "text-emerald-400"}>
            {status.toUpperCase()}
          </span>
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
