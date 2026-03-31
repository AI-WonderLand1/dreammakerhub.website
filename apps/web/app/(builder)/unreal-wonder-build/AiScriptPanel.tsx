"use client";

import { useState, useCallback, useRef } from "react";

type AgentStage = "architect" | "builder" | "reviewer";
interface AgentEvent { stage: AgentStage; status: string; label: string; message: string; }

const EXAMPLES = [
  "Rotate entity continuously on the Y axis",
  "Orbit camera around a target entity",
  "Spawn particle explosion on mouse click",
  "Animate entity scale on hover using tween",
  "First-person WASD camera controller",
  "Proximity trigger that plays a sound on enter",
];

export function AiScriptPanel() {
  const [prompt, setPrompt]   = useState("");
  const [agents, setAgents]   = useState<Partial<Record<AgentStage, AgentEvent>>>({});
  const [code, setCode]       = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [save, setSave]       = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const abortRef              = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setAgents({});
    setCode("");
    setError(null);
    setSavedPath(null);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/build/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: "playcanvas", save }),
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
          if (ev === "complete") { setCode(data.code); if (data.savedPath) setSavedPath(data.savedPath); }
          if (ev === "error")    setError(data.message);
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setError(e.message ?? "Failed");
    } finally {
      setRunning(false);
    }
  }, [prompt, running, save]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const stages: AgentStage[] = ["architect", "builder", "reviewer"];
  const stageIcons: Record<AgentStage, string> = { architect: "🏗️", builder: "⚙️", reviewer: "🔍" };

  return (
    <section className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-black mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <span className="text-sm font-semibold text-white">AI Script Generator</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">Gemini 2.5</span>
        </div>
        <span className="text-xs text-white/30">Generates pc.Script classes for PlayCanvas</span>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input column */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">Describe your script</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
              placeholder="e.g. Rotate the entity on Y axis with adjustable speed"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 resize-none focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>

          {/* Quick examples */}
          <div className="flex flex-wrap gap-1">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="text-[9px] px-2 py-1 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Save toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setSave((v) => !v)}
              className={`w-7 h-3.5 rounded-full transition-colors relative flex-shrink-0 ${save ? "bg-indigo-600" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${save ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-[10px] text-white/40">Save script to Runners (blocks/)</span>
          </label>

          {/* Generate button */}
          {!running ? (
            <button
              onClick={run}
              disabled={!prompt.trim()}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              🎮 Generate PlayCanvas Script
            </button>
          ) : (
            <button
              onClick={() => { abortRef.current?.abort(); setRunning(false); }}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-red-600/20 border border-red-500/30 text-red-400"
            >
              ⏹ Stop
            </button>
          )}

          {/* Agent stages */}
          {(Object.keys(agents).length > 0 || running) && (
            <div className="flex flex-col gap-1.5 mt-1">
              {stages.map((stage) => {
                const ev = agents[stage];
                const status = ev?.status ?? "idle";
                return (
                  <div key={stage} className={`flex items-start gap-2 rounded-lg p-2 border transition-all ${
                    status === "running" ? "border-indigo-500/30 bg-indigo-500/5" :
                    status === "done"    ? "border-green-500/20 bg-green-500/5" :
                    "border-white/5 opacity-30"
                  }`}>
                    <span className="text-sm mt-0.5 flex-shrink-0">{stageIcons[stage]}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium text-white/60">{ev?.label ?? stage}</span>
                        {status === "running" && (
                          <span className="flex gap-0.5">
                            {[0,1,2].map((i) => <span key={i} className="w-0.5 h-0.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                          </span>
                        )}
                        {status === "done" && <span className="text-green-400 text-[10px]">✓</span>}
                      </div>
                      {ev?.message && <p className="text-[9px] text-white/35 line-clamp-1">{ev.message}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</p>}
          {savedPath && (
            <p className="text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2 py-1">
              🚀 Saved: {savedPath.split("/").slice(-2).join("/")}
            </p>
          )}
        </div>

        {/* Code output column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Generated Script</span>
            {code && (
              <div className="flex gap-2">
                <button onClick={copyCode} className="text-[10px] px-2 py-1 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-colors">
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(code)}`}
                  download="wonder-script.js"
                  className="text-[10px] px-2 py-1 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-colors"
                >
                  Download .js
                </a>
              </div>
            )}
          </div>
          <div className="relative rounded-lg border border-white/10 bg-[#080810] overflow-auto" style={{ minHeight: "200px", maxHeight: "360px" }}>
            {code ? (
              <pre className="p-3 text-[10px] font-mono text-emerald-300/80 leading-relaxed whitespace-pre-wrap">
                <code>{code}</code>
              </pre>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                {running ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-indigo-500/30 animate-ping" />
                    <p className="text-[10px] text-white/30">Generating…</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-white/20">
                    Your PlayCanvas script will appear here.<br/>
                    Paste it directly into the PlayCanvas editor.
                  </p>
                )}
              </div>
            )}
          </div>
          {code && (
            <p className="text-[9px] text-white/25 text-center">
              Paste this script in the PlayCanvas editor → Scripts → New Script
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
