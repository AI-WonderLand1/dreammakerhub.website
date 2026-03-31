'use client';

import { useEffect, useRef, useState } from 'react';
import { useSovereignOS } from '../context/SovereignOSContext';

export function PlaygroundPanel() {
  const { result, editorCode, running, playgroundPlaying, togglePlayground } = useSovereignOS();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editorCode || !result) {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
      setBlobUrl(null);
      return;
    }

    const blob = new Blob([editorCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    prevUrlRef.current = url;
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      prevUrlRef.current = null;
    };
  }, [editorCode, result]);

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-white/10 bg-[#0d0d0d]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/70 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Live Preview
        </span>

        <div className="ml-auto flex items-center gap-2">
          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-white/50 hover:text-white/80 transition-colors"
            >
              ↗ Open
            </a>
          )}
          {result && (
            <button
              onClick={togglePlayground}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                playgroundPlaying
                  ? 'border-green-500/40 bg-green-500/10 text-green-300'
                  : 'border-white/15 bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {playgroundPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 relative overflow-hidden">
        {!result && !running && (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="text-5xl opacity-15">🖥</span>
            <div>
              <p className="text-sm font-semibold text-white/20">Live Preview</p>
              <p className="mt-1 text-[11px] text-white/15 leading-relaxed">
                Build with AI → preview renders<br />here in real time. No iframe sandbox.
              </p>
            </div>
          </div>
        )}

        {running && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-violet-500/40 animate-ping" style={{ animationDelay: '0.4s' }} />
              <div className="absolute inset-4 flex items-center justify-center">
                <span className="text-xl animate-spin" style={{ animationDuration: '3s' }}>✨</span>
              </div>
            </div>
            <p className="text-[11px] text-violet-300 animate-pulse">Preview incoming…</p>
          </div>
        )}

        {blobUrl && (
          <iframe
            key={blobUrl}
            src={blobUrl}
            title="Live Preview"
            className="absolute inset-0 h-full w-full border-0"
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
}
