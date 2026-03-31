import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground | AI Wonderland",
  description: "Test and experiment with AI models in an interactive environment",
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode[];
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="relative h-full w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,119,198,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_30%)] blur-xl" />

        <div className="relative mx-auto flex h-screen max-w-7xl flex-col px-4 py-6 sm:px-8">

          {/* Outer Wonderland Shell */}
          <div className="flex-1 rounded-3xl border border-white/5 bg-slate-900/60 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl p-6 flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-slate-400">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-lg font-bold text-sky-200 shadow-inner shadow-sky-500/10">
                  ✶
                </span>
                <span>AI-WONDERLAND PLAYGROUND</span>
              </div>

              <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                <span className="h-px w-10 bg-slate-700/60" />
                <span>Calm, exploratory canvas</span>
              </div>
            </div>

            {/* 3‑Panel Grid */}
            <div className="relative grid h-full grid-cols-[260px_1fr_40%] gap-4">
              {children}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
