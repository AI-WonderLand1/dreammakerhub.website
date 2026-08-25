import { logger } from '@/lib/logger';
export default function AIDiagram() {
  const nodeClass = "rounded-xl border border-white/10 bg-black/60 backdrop-blur-sm p-4 text-center transition hover:border-purple-500/30";

  return (
    <section className="relative mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-950 to-black px-6 py-14 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />

      <div className="relative z-10">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-400">
            Architecture
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            How AI Powers Every Layer
          </h2>
          <p className="mt-3 text-sm text-gray-400 max-w-xl mx-auto">
            A unified AI orchestration layer routes intelligence to every tool in the platform — from 3D scene generation to code completion.
          </p>
        </div>

        <div className="flex flex-col items-center gap-0">
          {/* ─── Top: AI Orchestration ─────────────── */}
          <div className={nodeClass + " w-full max-w-lg border-purple-500/20 bg-purple-950/20"}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs">⚡</span>
              <span className="text-sm font-bold text-purple-300">AI Orchestration Layer</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {["OpenRouter", "Groq", "Cerebras", "GitHub Models", "Gemini"].map((p) => (
                <span key={p} className="rounded-full bg-purple-900/40 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* ─── Vertical connector ─────────────── */}
          <div className="flex justify-center">
            <div className="h-6 w-px bg-gradient-to-b from-purple-500/40 to-purple-500/10" />
          </div>

          {/* ─── Middle: Three columns ──────────── */}
          <div className="relative flex w-full max-w-4xl items-start justify-center">
            <div className="absolute left-[16.66%] right-[16.66%] top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent hidden sm:block" />

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className={nodeClass + " border-violet-500/20"}>
                <div className="relative">
                  <div className="absolute -top-8 left-1/2 h-6 w-px -translate-x-1/2 bg-gradient-to-b from-purple-500/20 to-violet-500/20 hidden sm:block" />
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-900/40 border border-violet-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-violet-300">
                    ⚡ WonderBuild
                  </span>
                </div>
                <div className="mt-2 space-y-1.5 text-left">
                  <Row icon="🧠" label="Architect Agent" desc="Designs the solution" />
                  <Row icon="🔨" label="Builder Agent" desc="Generates code" />
                  <Row icon="🔍" label="Reviewer Agent" desc="Validates output" />
                </div>
              </div>

              <div className={nodeClass + " border-cyan-500/20"}>
                <div className="relative">
                  <div className="absolute -top-8 left-1/2 h-6 w-px -translate-x-1/2 bg-gradient-to-b from-purple-500/20 to-cyan-500/20 hidden sm:block" />
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-cyan-900/40 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                    🌐 WonderPlay
                  </span>
                </div>
                <div className="mt-2 space-y-1.5 text-left">
                  <Row icon="🏗️" label="Scene Generator" desc="AI builds 3D environments" />
                  <Row icon="🎭" label="Asset Generator" desc="Textures, models, materials" />
                  <Row icon="🎬" label="Animation AI" desc="Auto-rig & animate" />
                </div>
              </div>

              <div className={nodeClass + " border-amber-500/20"}>
                <div className="relative">
                  <div className="absolute -top-8 left-1/2 h-6 w-px -translate-x-1/2 bg-gradient-to-b from-purple-500/20 to-amber-500/20 hidden sm:block" />
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-900/40 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    💻 WonderSpace IDE
                  </span>
                </div>
                <div className="mt-2 space-y-1.5 text-left">
                  <Row icon="✨" label="Code Completion" desc="AI autocomplete" />
                  <Row icon="🐛" label="Auto Debug" desc="Fix errors instantly" />
                  <Row icon="📝" label="Commit Gen" desc="Generate commit messages" />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent hidden sm:block" />
          </div>

          {/* ─── Vertical connector to AI Wonderland ── */}
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-px bg-gradient-to-b from-purple-500/10 to-purple-500/40" />
          </div>

          {/* ─── AI Wonderland Convergence Layer ────── */}
          <div className={nodeClass + " mt-0 w-full max-w-lg border-pink-500/20 bg-pink-950/10"}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-xs">✨</span>
              <span className="text-sm font-bold text-pink-300">AI Wonderland Convergence</span>
            </div>
            <p className="text-[10px] text-white/40 mb-2">All tools feed into the AI Wonderland experience layer</p>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <span>🧙</span> Spirit Guide
              </span>
              <span className="flex items-center gap-1">
                <span>🤖</span> AI Agents
              </span>
              <span className="flex items-center gap-1">
                <span>⚙️</span> Background Runners
              </span>
              <span className="flex items-center gap-1">
                <span>🧠</span> Memory System
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-white/20 font-mono">
            Every AI feature routes through the orchestration layer — model-agnostic, hot-swappable, continuously improving.
          </p>
        </div>
      </div>
    </section>
  );
}

function Row({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
      <span className="shrink-0 text-xs">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-white/80">{label}</p>
        <p className="text-[10px] text-white/40">{desc}</p>
      </div>
    </div>
  );
}
