'use client';

import { useEffect, useState } from 'react';
import { useSovereignOS } from '../context/SovereignOSContext';

export function PlaygroundPanel() {
  const { result, editorCode, running, playgroundPlaying, togglePlayground, confessions } = useSovereignOS();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<'preview' | 'split'>('split');

  useEffect(() => {
    if (!editorCode || !result) {
      setBlobUrl(null);
      return;
    }

    const blob = new Blob([editorCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [editorCode, result]);

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-white/10 bg-[#111114]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/70 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Workspace
        </span>
        <div className="ml-2 flex items-center overflow-hidden rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setWorkspaceView('preview')}
            className={`px-2.5 py-1 text-[10px] font-semibold ${workspaceView === 'preview' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceView('split')}
            className={`px-2.5 py-1 text-[10px] font-semibold ${workspaceView === 'split' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
          >
            Split
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-white/50 hover:text-white/80 transition-colors"
            >
              Open in new tab
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
              {playgroundPlaying ? 'Pause' : 'Play'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 relative overflow-hidden">
        {!result && !running && (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="text-5xl opacity-15">Preview</span>
            <div>
              <p className="text-sm font-semibold text-white/20">Live Preview</p>
              <p className="mt-1 text-[11px] text-white/15 leading-relaxed">
                Build with AI, preview opens in a new tab.
              </p>
            </div>
          </div>
        )}

        {running && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/20 p-5 shadow-2xl backdrop-blur-lg">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-400/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border border-violet-300/50 animate-ping" style={{ animationDelay: '0.4s' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Almost done...</p>
                  <p className="text-xs text-white/70">AI is building your preview template now.</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200">Tips / Confessions</p>
                <p className="mt-2 text-xs text-white/80">
                  {confessions[confessions.length - 1]?.text ?? 'Generating layout, wiring sections, and preparing handoff to Puck + shadcn/ui.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {result && !running && (
          <div className={`grid h-full gap-3 p-3 ${workspaceView === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Live Preview</p>
              <div className="flex h-[calc(100%-1.25rem)] min-h-60 items-center justify-center rounded-lg border border-white/10 bg-black/40 p-4 text-center">
                <div>
                  <p className="text-sm text-white/60">Build complete</p>
                  <p className="mt-1 text-[11px] text-white/35">{(result.code.length / 1024).toFixed(1)} KB generated</p>
                  {blobUrl && (
                    <a
                      href={blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition-colors"
                    >
                      Open Preview
                    </a>
                  )}
                </div>
              </div>
            </div>
            {workspaceView === 'split' && (
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Code Editor</p>
                <pre className="h-[calc(100%-1.25rem)] min-h-60 overflow-auto rounded-lg border border-white/10 bg-black/50 p-3 text-[11px] text-green-300/80">
                  <code>{editorCode.slice(0, 2500)}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
