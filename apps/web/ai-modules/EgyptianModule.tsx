"use client";

import React, { useMemo, useState } from "react";

export default function EgyptianModule() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"guide" | "spell" | "scribe">("guide");

  const hint = useMemo(() => {
    if (mode === "guide") return "Describe what you’re building. I’ll suggest blocks + wiring.";
    if (mode === "spell") return "Give a goal. I’ll propose a prototype action plan.";
    return "Write text and I’ll format it into a clean section.";
  }, [mode]);

  return (
    <div className="p-6 bg-neutral-900 border border-amber-900/30 rounded-xl shadow-2xl">
      <h2 className="text-xl md:text-2xl font-serif text-amber-500 mb-4 border-b border-amber-900/30 pb-2">
        Egyptian Module
      </h2>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("guide")}
          className={`px-3 py-2 rounded-lg text-xs font-black tracking-widest uppercase border ${
            mode === "guide"
              ? "bg-amber-500/10 border-amber-400/40 text-amber-200"
              : "bg-black/20 border-white/10 text-white/70"
          }`}
        >
          Guide
        </button>

        <button
          type="button"
          onClick={() => setMode("spell")}
          className={`px-3 py-2 rounded-lg text-xs font-black tracking-widest uppercase border ${
            mode === "spell"
              ? "bg-amber-500/10 border-amber-400/40 text-amber-200"
              : "bg-black/20 border-white/10 text-white/70"
          }`}
        >
          Spell
        </button>

        <button
          type="button"
          onClick={() => setMode("scribe")}
          className={`px-3 py-2 rounded-lg text-xs font-black tracking-widest uppercase border ${
            mode === "scribe"
              ? "bg-amber-500/10 border-amber-400/40 text-amber-200"
              : "bg-black/20 border-white/10 text-white/70"
          }`}
        >
          Scribe
        </button>
      </div>

      <div className="text-xs text-white/50 mb-2">{hint}</div>

      <textarea
        className="w-full h-28 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white/85 outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type here…"
      />

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-white/40">
          Tip: prototype wiring can dispatch <span className="text-amber-200">wb:run-ai</span>.
        </div>
        <button
          type="button"
          onClick={() => setInput("")}
          className="px-3 py-2 rounded-lg text-xs font-black tracking-widest uppercase border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
