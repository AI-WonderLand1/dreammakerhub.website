'use client';

export interface ConfessionEntry {
  label: string;
  text: string;
  trustScore?: number;
  constitutionalCheck?: 'pending' | 'passed' | 'failed';
  workerId?: string;
  at: string;
}

interface ConfessionsDrawerProps {
  confessions: ConfessionEntry[];
  open: boolean;
  onClose?: () => void;
}

const CHECK_COLORS = {
  passed: 'text-green-400 bg-green-500/10 border-green-500/25',
  failed: 'text-red-400 bg-red-500/10 border-red-500/25',
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
};

function TrustBar({ score }: { score: number }) {
  const pct = Math.round(Math.min(100, Math.max(0, score * 100)));
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 mt-1 pointer-events-none select-none">
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-white/40 font-mono shrink-0">{pct}% trust</span>
    </div>
  );
}

export function ConfessionsDrawer({ confessions, open }: ConfessionsDrawerProps) {
  if (!open) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-violet-500/20 bg-[#0a0a10]">
      {/* Header — view-only label, no buttons */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/60 px-3 py-2 pointer-events-none select-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
          AI Confessions
        </span>
        <span className="ml-1 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">
          {confessions.length}
        </span>
        <span className="text-[9px] text-white/20 ml-1">read-only · view only</span>
      </div>

      {/* Confessions list — scrollable but not interactive */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2">
        {confessions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center pointer-events-none select-none">
            <span className="text-3xl opacity-20">🤫</span>
            <p className="text-[11px] text-white/20">
              No confessions yet. Build something with the AI agents<br />and their internal reasoning will appear here.
            </p>
          </div>
        )}

        {confessions.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/8 bg-white/[0.02] p-3 pointer-events-none select-none cursor-default"
            aria-readonly="true"
          >
            <div className="flex items-start gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-violet-400 shrink-0 mt-0.5">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-white/70">{c.label}</span>
                  {c.workerId && (
                    <span className="rounded border border-white/10 bg-white/5 px-1 text-[9px] text-white/30 font-mono">
                      Worker {c.workerId}
                    </span>
                  )}
                  {c.constitutionalCheck && (
                    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${CHECK_COLORS[c.constitutionalCheck]}`}>
                      {c.constitutionalCheck}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/25 mt-0.5 font-mono">
                  {new Date(c.at).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed rounded-lg bg-white/[0.03] border border-white/5 p-2 font-mono">
              {c.text}
            </p>

            {c.trustScore != null && <TrustBar score={c.trustScore} />}
          </div>
        ))}
      </div>
    </div>
  );
}
