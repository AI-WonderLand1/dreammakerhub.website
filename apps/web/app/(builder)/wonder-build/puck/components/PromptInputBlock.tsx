"use client";

export type PromptInputBlockProps = {
  placeholder: string;
  buttonLabel: string;
  label: string;
  theme: "violet" | "cyan" | "amber";
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
  buttonLabel = "✨ Magic",
  label = "AI Prompt",
  theme = "violet",
}: PromptInputBlockProps) {
  const t = themes[theme];

  return (
    <div className="p-4" data-block="prompt-input">
      {label && (
        <p className={`mb-2 text-xs font-semibold uppercase tracking-widest ${t.label}`}>
          {label}
        </p>
      )}
      <div className={`rounded-2xl border bg-white/[0.03] p-1 transition ${t.border}`}>
        <textarea
          readOnly
          rows={4}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-white placeholder:text-white/30 outline-none"
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <p className={`text-[10px] ${t.hint}`}>Press Enter or click the button to generate</p>
          <button className={`rounded-xl px-5 py-2 text-sm font-bold transition ${t.btn}`}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
