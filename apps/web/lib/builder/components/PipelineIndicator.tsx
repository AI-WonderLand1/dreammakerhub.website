'use client';

import { useEffect, useState, useRef } from 'react';
import { getEventBus } from '../pipeline/EventBus';
import { EventNames, type EventPayload, type EventEnvelope } from '../pipeline/types';
import { getPipeline } from '../pipeline/PipelineManager';

interface ServiceStatus {
  name: string;
  running: boolean;
}

export default function PipelineIndicator() {
  const [status, setStatus] = useState<'starting' | 'running' | 'error'>('starting');
  const [eventCount, setEventCount] = useState(0);
  const [lastEvent, setLastEvent] = useState('');
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const maxHistory = 20;
  const errorCount = useRef(0);

  useEffect(() => {
    const pipe = getPipeline({ autoStart: false });
    if (!pipe.isRunning()) {
      try {
        pipe.start();
      } catch {
        setStatus('error');
        return;
      }
    }
    setStatus('running');

    const svcs = pipe.getServices();
    setServices([
      { name: 'Builder', running: true },
      { name: 'State', running: true },
      { name: 'Files', running: true },
      { name: 'CodeGen', running: true },
      { name: 'Validation', running: true },
      { name: 'Preview', running: !!svcs.livePreviewService },
      { name: 'Dashboard', running: !!svcs.dashboardService },
      { name: 'Storage', running: !!svcs.storageService },
      { name: 'History', running: true },
      { name: 'Analytics', running: true },
    ]);

    const bus = getEventBus();
    const unsubWild = bus.onWildcard((event) => {
      setEventCount((c) => c + 1);
      const name = event.name.split(':').pop() || event.name;
      setHistory((h) => [name, ...h].slice(0, maxHistory));
    });

    const unsubError = bus.on(EventNames.SYSTEM_ERROR, (event) => {
      const { message } = event.payload as EventPayload<typeof EventNames.SYSTEM_ERROR>;
      errorCount.current++;
      setLastEvent(`⚠️ ${message}`);
    });

    const unsubInfo = bus.on(EventNames.SYSTEM_INFO, (event) => {
      const { message } = event.payload as EventPayload<typeof EventNames.SYSTEM_INFO>;
      setLastEvent(message);
    });

    const unsubStorage = bus.on(EventNames.STORAGE_SAVED, () => {
      setLastEvent('💾 Saved');
    });

    const unsubValid = bus.on(EventNames.VALIDATION_COMPLETED, (event) => {
      const { passed, issues, duration } = event.payload as EventPayload<typeof EventNames.VALIDATION_COMPLETED>;
      const errs = issues.filter((i) => i.severity === 'error').length;
      setLastEvent(passed ? `✅ Valid (${duration.toFixed(0)}ms)` : `❌ ${errs} errors`);
    });

    const unsubCodeGen = bus.on(EventNames.CODE_GENERATED, (event) => {
      const { files, duration } = event.payload as EventPayload<typeof EventNames.CODE_GENERATED>;
      setLastEvent(`📝 ${files.length} files (${duration}ms)`);
    });

    const unsubDash = bus.on(EventNames.DASHBOARD_STATS_UPDATED, (event) => {
      const stats = (event.payload as EventPayload<typeof EventNames.DASHBOARD_STATS_UPDATED>);
      setLastEvent(`📊 ${stats.elementCount}el ${stats.fileCount}f`);
    });

    return () => {
      unsubWild();
      unsubError();
      unsubInfo();
      unsubStorage();
      unsubValid();
      unsubCodeGen();
      unsubDash();
    };
  }, []);

  const hasErrors = errorCount.current > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-medium transition-colors cursor-pointer hover:opacity-80"
        style={{
          borderColor: hasErrors ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
          backgroundColor: hasErrors ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
          color: hasErrors ? 'rgb(248,113,113)' : 'rgb(52,211,153)',
        }}
        title={`${eventCount} events · ${lastEvent}`}
        aria-label="Pipeline status"
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: hasErrors ? 'rgb(248,113,113)' : 'rgb(52,211,153)',
            animation: 'pulse 2s infinite',
          }}
        />
        <span>pipeline</span>
        <span className="opacity-60">{eventCount}</span>
      </button>

      {expanded && (
        <div className="absolute top-full right-0 mt-1 w-64 rounded-lg border border-white/10 bg-[#0b0f19] shadow-xl z-50 p-3 text-[10px] font-mono" style={{ maxHeight: '300px', overflow: 'auto' }}>
          <div className="text-white/50 text-[9px] uppercase tracking-wider mb-2">Pipeline Status</div>
          <div className="space-y-1 mb-3">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-white/70">{s.name}</span>
                <span className={s.running ? 'text-emerald-400' : 'text-red-400'}>{s.running ? '●' : '○'}</span>
              </div>
            ))}
          </div>
          <div className="text-white/50 text-[9px] uppercase tracking-wider mb-1">Events</div>
          <div className="flex flex-wrap gap-1">
            {history.map((h, i) => (
              <span key={i} className="px-1 py-0.5 rounded bg-white/5 text-white/60 text-[8px]">{h}</span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
