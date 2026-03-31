'use client';

import dynamic from 'next/dynamic';

function BuilderLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-[#0a0a0a]">
      <style>{`
        @keyframes neonSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .neon-sweep { animation: neonSweep 1.4s ease-in-out infinite; }
      `}</style>

      <div className="relative w-48 overflow-hidden rounded-full bg-white/[0.06] h-[3px]">
        <div className="neon-sweep absolute inset-y-0 w-1/4 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40">
          Warming up engines
        </p>
        <div className="flex gap-1.5">
          {['Theia', 'WebGLS', 'PlayCanvas', 'Puck'].map((name, i) => (
            <span
              key={name}
              className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/20"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const TriEngineShell = dynamic(
  () => import('../../components/QuadEngineShell').then((m) => ({ default: m.QuadEngineShell })),
  { ssr: false, loading: () => <BuilderLoader /> }
);

export default function BuilderPage() {
  return <TriEngineShell />;
}
