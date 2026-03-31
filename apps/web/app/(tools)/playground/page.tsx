"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Play,
  RotateCcw,
  Loader2,
  ChevronDown,
  PanelsTopLeft,
  Settings2,
  Wand2,
  ChevronRight,
  PanelLeftOpen,
  PanelRightOpen,
} from "lucide-react";
import { PLAYGROUND_PRESETS, PlaygroundModuleId } from "@/types/playground";
import { playgroundModuleCatalog } from "@core/playground/moduleCatalog";

type Project = { id: string; name: string };

type RunResult = {
  message: { role: string; content: string } | string | null;
  previewSummary?: string;
  previewFiles?: string[];
  appliedFiles?: string[];
};

type Interaction = {
  id: string;
  prompt: string;
  moduleId: PlaygroundModuleId;
  mode: "test" | "apply";
  status: "running" | "done" | "error";
  result?: RunResult;
  error?: string | null;
  timestamp: number;
};

type SelectionState = {
  text: string;
  isCode: boolean;
  top: number;
  left: number;
};

export default function PlaygroundPage() {
  const [selectedModule, setSelectedModule] = useState<PlaygroundModuleId>("chat");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loadingMode, setLoadingMode] = useState<"test" | "apply" | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [undoLoading, setUndoLoading] = useState(false);
  const [modulesPanelOpen, setModulesPanelOpen] = useState(false);
  const [parametersOpen, setParametersOpen] = useState(false);
  const [advancedParametersOpen, setAdvancedParametersOpen] = useState(false);
  const [projectToolsOpen, setProjectToolsOpen] = useState(false);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [parameters, setParameters] = useState({
    temperature: 0.6,
    topP: 0.9,
    maxTokens: 800,
    stream: true,
    keepContext: true,
  });
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  const moduleLookup = useMemo(
    () => Object.fromEntries(playgroundModuleCatalog.map((module) => [module.id, module])),
    []
  );

  useEffect(() => {
    if (playgroundModuleCatalog.length > 0) {
      setSelectedModule(playgroundModuleCatalog[0].id);
    }
  }, []);

  useEffect(() => {
    const handleSelection = () => {
      if (!outputRef.current) {
        setSelection(null);
        return;
      }
      const selectionObj = window.getSelection();
      if (!selectionObj || selectionObj.isCollapsed) {
        setSelection(null);
        return;
      }
      const text = selectionObj.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }
      const anchorNode = selectionObj.anchorNode;
      if (!anchorNode || !outputRef.current.contains(anchorNode)) {
        setSelection(null);
        return;
      }
      const range = selectionObj.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = outputRef.current.getBoundingClientRect();
      setSelection({
        text,
        isCode: /```|function|const |class |=>/.test(text),
        top: rect.top - containerRect.top + outputRef.current.scrollTop,
        left: rect.left - containerRect.left + rect.width / 2 + outputRef.current.scrollLeft,
      });
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  useEffect(() => {
    if (!parametersOpen || projectsLoaded) return;
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          setProjectId((prev) => prev || data.projects[0].id);
          setProjectsLoaded(true);
        }
      } catch {
        // ignore
      }
    };
    loadProjects();
  }, [parametersOpen, projectsLoaded]);

  const handleRun = async (mode: "test" | "apply") => {
    if (!prompt.trim()) return;
    if (mode === "apply" && !projectId) {
      setError("Select a project to apply changes.");
      setParametersOpen(true);
      setProjectToolsOpen(true);
      return;
    }
    const runId = crypto.randomUUID();
    const moduleId = selectedModule || "chat";
    const timestamp = Date.now();

    setError(null);
    setInteractions((prev) => [
      {
        id: runId,
        prompt: prompt.trim(),
        moduleId,
        mode,
        status: "running",
        timestamp,
      },
      ...prev,
    ]);
    setLoadingMode(mode);

    try {
      const res = await fetch("/api/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          mode,
          prompt,
          projectId: mode === "apply" ? projectId : undefined,
          parameters,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Request failed");
      }
      const nextResult: RunResult = {
        message: data.preview?.summary
          ? data.preview.summary
          : data.message ?? { role: "assistant", content: data.preview?.summary ?? "" },
        previewSummary: data.preview?.summary,
        previewFiles: data.preview?.changedFiles,
        appliedFiles: data.applied?.changedFiles,
      };
      setInteractions((prev) =>
        prev.map((run) =>
          run.id === runId ? { ...run, status: "done", result: nextResult } : run
        )
      );
    } catch (err: any) {
      const message = err?.message || "Failed to run";
      setError(message);
      setInteractions((prev) =>
        prev.map((run) => (run.id === runId ? { ...run, status: "error", error: message } : run))
      );
    } finally {
      setLoadingMode(null);
    }
  };

  const handleUndo = async () => {
    if (!projectId) {
      setError("Select a project to undo.");
      return;
    }
    setUndoLoading(true);
    setError(null);
    try {
      const listRes = await fetch(`/api/projects/${projectId}/snapshots`);
      const listData = await listRes.json();
      const latest = listData?.snapshots?.[0];
      if (!latest) {
        setError("No snapshots to restore.");
        return;
      }
      const res = await fetch(`/api/projects/${projectId}/snapshots/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId: latest.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Restore failed");
        return;
      }
      setInteractions((prev) => [
        {
          id: crypto.randomUUID(),
          prompt: "Undo last apply",
          moduleId: selectedModule,
          mode: "apply",
          status: "done",
          timestamp: Date.now(),
          result: { message: "Latest snapshot restored.", appliedFiles: latest.files },
        },
        ...prev,
      ]);
    } catch (err: any) {
      setError(err?.message || "Undo failed");
    } finally {
      setUndoLoading(false);
    }
  };

  const selectionActions = useMemo(() => {
    if (!selection) return [];
    const baseActions = ["Explain", "Summarize", "Refactor"];
    if (selection.isCode) {
      baseActions.push("Explain Code", "Optimize");
    }
    return baseActions;
  }, [selection]);

  const handleSelectionAction = (action: string) => {
    if (!selection) return;
    const context = selection.isCode ? "code" : "text";
    const nextPrompt = `${action} this ${context}:\n${selection.text}`;
    setPrompt(nextPrompt);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  const statusLabel = (status: Interaction["status"]) => {
    if (status === "running") return "In progress";
    if (status === "error") return "Needs attention";
    return "Complete";
  };

  const isBusy = loadingMode !== null;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-2 sm:px-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">WONDERSPACE</p>
          <h1 className="text-3xl font-semibold text-slate-50">Playground</h1>
          <p className="text-sm text-slate-400">
            Start with a calm chat canvas. Reveal controls only when you need them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModulesPanelOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 hover:border-slate-500/40 hover:bg-white/10"
          >
            <PanelsTopLeft className="h-4 w-4" />
            Modules
            <ChevronDown className={`h-4 w-4 transition ${modulesPanelOpen ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => setParametersOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-slate-50 hover:border-sky-400/60 hover:bg-sky-500/20"
          >
            <Settings2 className="h-4 w-4" />
            Advanced
            <ChevronDown className={`h-4 w-4 transition ${parametersOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 gap-4 px-4 pb-4 sm:px-8">
        <div
          className={`absolute left-0 top-0 z-20 h-full w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-xl transition-all duration-300 lg:-left-4 ${
            modulesPanelOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-10 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-sm text-slate-200">
            <div className="flex items-center gap-2">
              <PanelLeftOpen className="h-4 w-4 text-sky-300" />
              <span>Module explorer</span>
            </div>
            <button
              onClick={() => setModulesPanelOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-white/5 hover:text-slate-100"
              aria-label="Close module panel"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto px-4 py-4">
            {playgroundModuleCatalog.map((mod) => (
              <div
                key={mod.id}
                className={`rounded-xl border p-3 transition ${
                  selectedModule === mod.id
                    ? "border-sky-400/50 bg-sky-500/10 shadow-[0_10px_30px_rgba(56,189,248,0.15)]"
                    : "border-white/5 bg-white/5 hover:border-slate-500/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">{mod.label}</p>
                    <p className="text-xs text-slate-400">{mod.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedModule(mod.id)}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-50 hover:border-sky-400/60 hover:bg-sky-500/10"
                  >
                    Use
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[11px] capitalize">
                    <Wand2 className="h-3 w-3" />
                    {mod.kind} mode
                  </span>
                  <button
                    onClick={() =>
                      setPrompt((prev) => prev || PLAYGROUND_PRESETS.find((p) => p.moduleId === mod.id)?.prompt || "")
                    }
                    className="text-[11px] text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline"
                  >
                    Load example
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4">
          <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/40 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200 shadow-inner shadow-sky-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {moduleLookup[selectedModule]?.label ?? "Chat"}
                  </p>
                  <p className="text-xs text-slate-400">Chat-first. Iterate instantly.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                  <span>Loop ready</span>
                </div>
                <button
                  onClick={() => setModulesPanelOpen(true)}
                  className="rounded-full border border-white/10 px-3 py-1 text-slate-200 hover:border-sky-400/50 hover:bg-sky-500/10"
                >
                  Switch module
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask anything and stay in flow..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                rows={6}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleRun("test")}
                  disabled={isBusy || !prompt.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500/80 via-sky-400/80 to-violet-500/70 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_10px_40px_rgba(56,189,248,0.35)] transition hover:scale-[1.01] hover:shadow-[0_12px_45px_rgba(124,58,237,0.25)] disabled:opacity-60"
                >
                  {loadingMode === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Run
                </button>
                <button
                  onClick={() => handleRun("apply")}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 hover:border-sky-400/40 hover:bg-sky-500/10 disabled:opacity-60"
                >
                  {loadingMode === "apply" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Apply to project
                </button>
                <button
                  onClick={() => setParametersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/5 px-3 py-2 text-xs text-slate-300 hover:border-sky-400/40 hover:text-sky-200"
                >
                  <ChevronRight className="h-4 w-4" />
                  Reveal advanced controls
                </button>
                <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                  <span>Prompts persist. Re-run instantly.</span>
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-red-400" />
                  <div>
                    <p className="font-semibold">Something needs attention</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-4 shadow-inner shadow-sky-500/10 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Results</p>
                <p className="text-xs text-slate-400">Every prompt + output stays in view.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-white/5 px-2 py-1">Contextual tools on selection</span>
              </div>
            </div>
            <div ref={outputRef} className="relative mt-4 flex-1 space-y-3 overflow-y-auto pb-2">
              {selection && (
                <div
                  className="absolute z-20 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 px-2 py-1 text-[11px] text-slate-100 shadow-lg shadow-slate-900/50 backdrop-blur"
                  style={{ top: selection.top - 32, left: selection.left }}
                >
                  <div className="flex items-center gap-1">
                    {selectionActions.map((action) => (
                      <button
                        key={action}
                        onClick={() => handleSelectionAction(action)}
                        className="rounded-full px-2 py-1 text-[11px] text-sky-200 hover:bg-sky-500/10"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {interactions.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                  Start with a single prompt. Outputs will collect here so you can tweak and re-run without losing context.
                </div>
              )}
              {interactions.map((run) => {
                const message =
                  typeof run.result?.message === "string"
                    ? run.result?.message
                    : run.result?.message?.content ?? "";
                const timestamp = new Date(run.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={run.id}
                    className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/60 p-4 shadow shadow-slate-900/30"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-500/20 via-transparent to-violet-500/20 opacity-0 transition group-hover:opacity-100" />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">
                          {moduleLookup[run.moduleId]?.label ?? run.moduleId}
                        </span>
                        <span className="text-[11px] text-slate-500">{timestamp}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] ${
                          run.status === "running"
                            ? "bg-amber-500/20 text-amber-200"
                            : run.status === "error"
                              ? "bg-red-500/20 text-red-100"
                              : "bg-emerald-500/15 text-emerald-200"
                        }`}
                      >
                        {statusLabel(run.status)}
                      </span>
                    </div>
                    <div className="mt-3 space-y-3 text-sm text-slate-200">
                      <div className="rounded-lg bg-white/5 px-3 py-2 text-slate-300">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Prompt</p>
                        <p className="whitespace-pre-wrap">{run.prompt}</p>
                      </div>
                      {run.status === "running" && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Running...</span>
                        </div>
                      )}
                      {run.status === "error" && run.error && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                          {run.error}
                        </div>
                      )}
                      {message && run.status === "done" && (
                        <div className="rounded-lg border border-white/5 bg-slate-900/70 px-3 py-2 text-slate-100">
                          <p className="text-[11px] uppercase tracking-wide text-sky-300">Output</p>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
                        </div>
                      )}
                      {run.result?.previewSummary && (
                        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                          <p className="font-semibold">Preview</p>
                          <p>{run.result.previewSummary}</p>
                          {run.result.previewFiles && run.result.previewFiles.length > 0 && (
                            <p className="mt-2 text-[11px] text-sky-200">
                              Changed files: {run.result.previewFiles.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                      {run.result?.appliedFiles && run.result.appliedFiles.length > 0 && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                          <p className="font-semibold">Applied</p>
                          <p className="text-[11px] text-emerald-50">Changed files: {run.result.appliedFiles.join(", ")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <div
          className={`absolute right-0 top-0 z-20 h-full w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300 lg:-right-4 ${
            parametersOpen
              ? "translate-x-0 opacity-100"
              : "translate-x-10 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-sm text-slate-200">
            <div className="flex items-center gap-2">
              <PanelRightOpen className="h-4 w-4 text-sky-300" />
              <span>Advanced controls</span>
            </div>
            <button
              onClick={() => setParametersOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-white/5 hover:text-slate-100"
              aria-label="Close advanced panel"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </button>
          </div>
          <div className="space-y-4 overflow-y-auto px-4 py-4">
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">Quick tuning</p>
                <span className="text-[11px] text-slate-400">Collapsed by default</span>
              </div>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <label className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Temperature</span>
                    <span>{parameters.temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={parameters.temperature}
                    onChange={(e) =>
                      setParameters((prev) => ({ ...prev, temperature: Number(e.target.value) }))
                    }
                    className="w-full accent-sky-400"
                  />
                </label>
                <label className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Top P</span>
                    <span>{parameters.topP.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={parameters.topP}
                    onChange={(e) => setParameters((prev) => ({ ...prev, topP: Number(e.target.value) }))}
                    className="w-full accent-sky-400"
                  />
                </label>
                <label className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Max tokens</span>
                    <span>{parameters.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={2000}
                    step={50}
                    value={parameters.maxTokens}
                    onChange={(e) =>
                      setParameters((prev) => ({ ...prev, maxTokens: Number(e.target.value) }))
                    }
                    className="w-full accent-sky-400"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5">
              <button
                onClick={() => setAdvancedParametersOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-slate-100"
              >
                <span>Advanced</span>
                <ChevronDown
                  className={`h-4 w-4 transition ${advancedParametersOpen ? "rotate-180 text-sky-300" : "text-slate-400"}`}
                />
              </button>
              {advancedParametersOpen && (
                <div className="space-y-3 border-t border-white/5 px-3 py-3 text-sm text-slate-200">
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-slate-950/50 px-3 py-2">
                    <div>
                      <p className="font-medium text-slate-100">Keep chat context</p>
                      <p className="text-xs text-slate-400">Reuse prior turns for iterative runs.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={parameters.keepContext}
                      onChange={(e) => setParameters((prev) => ({ ...prev, keepContext: e.target.checked }))}
                      className="h-4 w-4 accent-sky-400"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-slate-950/50 px-3 py-2">
                    <div>
                      <p className="font-medium text-slate-100">Stream responses</p>
                      <p className="text-xs text-slate-400">See tokens instantly while staying on page.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={parameters.stream}
                      onChange={(e) => setParameters((prev) => ({ ...prev, stream: e.target.checked }))}
                      className="h-4 w-4 accent-sky-400"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5">
              <button
                onClick={() => setProjectToolsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-slate-100"
              >
                <span>Project actions</span>
                <ChevronDown
                  className={`h-4 w-4 transition ${projectToolsOpen ? "rotate-180 text-sky-300" : "text-slate-400"}`}
                />
              </button>
              {projectToolsOpen && (
                <div className="space-y-3 border-t border-white/5 px-3 py-3 text-sm text-slate-200">
                  <label className="space-y-1 text-sm">
                    <span className="text-xs text-slate-400">Target project</span>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
                    >
                      <option value="">Select a project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={handleUndo}
                    disabled={undoLoading || !projectId}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-red-400/40 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    {undoLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Undo last apply
                  </button>
                  <p className="text-xs text-slate-400">
                    Apply + undo live here to keep the default view uncluttered.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
