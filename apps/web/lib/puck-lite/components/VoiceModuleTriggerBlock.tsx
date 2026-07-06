"use client";

export type VoiceModuleTriggerBlockProps = {
  title: string;
  description: string;
  language: string;
  theme: "egyptian" | "neon" | "minimal";
};

const themes = {
  egyptian: {
    wrapper: "border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-black",
    icon: "bg-amber-500/10 border border-amber-500/30 text-amber-300",
    title: "text-amber-400",
    btn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-black",
    badge: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    wave: "bg-amber-500",
  },
  neon: {
    wrapper: "border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-black",
    icon: "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300",
    title: "text-cyan-400",
    btn: "bg-cyan-500 hover:bg-cyan-400 text-black",
    badge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    wave: "bg-cyan-500",
  },
  minimal: {
    wrapper: "border-white/10 bg-white/[0.02]",
    icon: "bg-white/5 border border-white/20 text-white/70",
    title: "text-violet-400",
    btn: "bg-violet-600 hover:bg-violet-500 text-white",
    badge: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    wave: "bg-violet-500",
  },
};

export default function VoiceModuleTriggerBlock({
  title = "Egyptian Voice Module",
  description = "Activate AI-powered hieroglyphic voice synthesis. Speak in the tongue of the ancients.",
  language = "Ancient Egyptian",
  theme = "egyptian",
}: VoiceModuleTriggerBlockProps) {
  const t = themes[theme];

  return (
    <div className="p-4" data-block="voice-module-trigger">
      <div className={`rounded-2xl border p-6 ${t.wrapper}`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${t.icon}`}>
            𓂀
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-sm font-bold ${t.title}`}>{title}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${t.badge}`}>
                {language}
              </span>
            </div>
            <p className="text-xs text-white/50 mb-4">{description}</p>

            <div className="flex items-center gap-3">
              <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${t.btn}`}>
                <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                Activate Voice
              </button>

              <div className="flex items-center gap-0.5 h-6">
                {[3, 5, 8, 5, 3, 7, 4, 6, 3, 5].map((h, i) => (
                  <div
                    key={i}
                    className={`w-0.5 rounded-full opacity-40 ${t.wave}`}
                    style={{ height: `${h * 3}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
