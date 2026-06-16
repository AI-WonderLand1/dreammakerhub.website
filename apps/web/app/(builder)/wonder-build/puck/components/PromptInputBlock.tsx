"use client";

import { useState } from "react";

export type PromptInputBlockProps = {
  placeholder?: string;
  buttonLabel?: string;
  label?: string;
  theme?: "violet" | "cyan" | "amber";
  onSubmit?: (prompt: string) => void;
};

const themes = {
  violet: {
    border: "border-violet-500/40 focus-within:border-violet-400",
    btn: "bg-violet-600 hover:bg-violet-500 text-white",
    label: "text-violet-400",
    hint: "text-violet-300/60",
  },
  cyan: {
    border: "border-cyan-500/40 focus-within:border-cyan-400",
    btn: "bg-cyan-500 hover:bg-cyan-400 text-black",
    label: "text-cyan-400",
    hint: "text-cyan-300/60",
  },
  amber: {
    border: "border-amber-500/40 focus-within:border-amber-400",
    btn: "bg-amber-500 hover:bg-amber-400 text-black",
    label: "text-amber-400",
    hint: "text-amber-300/60",
  },
};

export default function PromptInputBlock({
  placeholder = "Describe what you want to build...",
  buttonLabel = "✨ Generate",
  label = "AI Prompt",
  theme = "violet",
  onSubmit,
}: PromptInputBlockProps) {
  const t = themes[theme];
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    if (onSubmit) {
      onSubmit(prompt);
    } else {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, agentId: "website_builder" }),
        });
        const data = await res.json();
        // Could emit event or callback with result
        console.log("AI response:", data);
      } catch (e) {
        console.error("AI request failed:", e);
      }
    }
    setLoading(false);
  }

  return (
    <div className="p-4" data-block="prompt-input">
      {label && (
        <p className={`mb-2 text-xs font-semibold uppercase tracking-widest ${t.label}`}>
          {label}
        </p>
      )}
      <div className={`rounded-2xl border bg-white/[0.03] p-1 transition ${t.border}`}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          rows={4}
          placeholder={placeholder}
          disabled={loading}
          className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-white placeholder:text-white/30 outline-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <p className={`text-[10px] ${t.hint}`}>Enter for single line, Shift+Enter for new line</p>
          <button 
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className={`rounded-xl px-5 py-2 text-sm font-bold transition disabled:opacity-50 ${t.btn}`}
          >
            {loading ? "Generating..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
