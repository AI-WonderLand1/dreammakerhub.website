'use client';

import { useEffect, useState } from 'react';
import { getEventBus } from '../pipeline/EventBus';
import { EventNames, type EventPayload } from '../pipeline/types';
import { getPipeline } from '../pipeline/PipelineManager';

export default function PipelineIndicator() {
  const [status, setStatus] = useState<'starting' | 'running' | 'error'>('starting');
  const [eventCount, setEventCount] = useState(0);
  const [lastEvent, setLastEvent] = useState('');

  useEffect(() => {
    const pipe = getPipeline({ autoStart: false });
    if (!pipe.isRunning()) {
      pipe.start();
    }
    setStatus('running');

    const bus = getEventBus();
    const unsub = bus.on('*' as any, () => {
      setEventCount((c) => c + 1);
    });

    const unsubError = bus.on(EventNames.SYSTEM_ERROR, (event) => {
      const { message } = event.payload as EventPayload<typeof EventNames.SYSTEM_ERROR>;
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
      const errors = issues.filter((i) => i.severity === 'error').length;
      setLastEvent(passed ? `✅ Valid (${duration.toFixed(0)}ms)` : `❌ ${errors} errors`);
    });

    const unsubCodeGen = bus.on(EventNames.CODE_GENERATED, (event) => {
      const { files, duration } = event.payload as EventPayload<typeof EventNames.CODE_GENERATED>;
      setLastEvent(`📝 Generated ${files.length} files (${duration}ms)`);
    });

    return () => {
      unsub();
      unsubError();
      unsubInfo();
      unsubStorage();
      unsubValid();
      unsubCodeGen();
    };
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-medium transition-colors"
      style={{
        borderColor: status === 'running' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
        backgroundColor: status === 'running' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        color: status === 'running' ? 'rgb(52,211,153)' : 'rgb(248,113,113)',
      }}
      title={`${eventCount} events · ${lastEvent}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: status === 'running' ? 'rgb(52,211,153)' : 'rgb(248,113,113)',
          animation: 'pulse 2s infinite',
        }}
      />
      <span>pipeline</span>
      {eventCount > 0 && (
        <span className="opacity-60">{eventCount}ev</span>
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
