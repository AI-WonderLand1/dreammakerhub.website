'use client';

import { useEffect, useState } from 'react';
import { useSovereignOS } from '../context/SovereignOSContext';

type EditorStatus = 'loading' | 'ready' | 'error';

export function WebGLEditorPanel() {
  // Get the ref from your context
  const { editorIframeRef, editorCode, result } = useSovereignOS();
  const [status, setStatus] = useState<EditorStatus>('loading');

  const editorSrc = '/webglstudio/webglstudio.js-master/editor/index.html';

  useEffect(() => {
    if (!result || !editorCode) return;
    // Cast to any here to prevent the "possibly null" build crash
    const iframe = editorIframeRef?.current as any;
    if (!iframe?.contentWindow) return;
    
    iframe.contentWindow.postMessage(
      { command: 'wonder:inject', code: editorCode, type: result.type },
      '*',
    );
  }, [result, editorCode, editorIframeRef]);

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d?.event === 'editor:ready' || d?.type === 'bridge:ready') {
        setStatus('ready');
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#111]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/80 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          WebGL Editor
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full transition-colors ${
              status === 'ready' ? 'bg-green-400' : status === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
            }`}
          />
          <span className="text-[10px] text-white/30 capitalize">{status}</span>
        </div>
      </div>

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-x-0 bottom-0 top-9 z-10 flex flex-col items-center justify-center gap-3 bg-[#111]">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-violet-500/50 animate-ping" style={{ animationDelay: '0.3s' }} />
            <div className="absolute inset-4 rounded-full bg-violet-600/20 flex items-center justify-center">
              <span className="text-xl">🎨</span>
            </div>
          </div>
          <p className="text-[11px] text-white/30">Loading WebGL Editor…</p>
        </div>
      )}

      {/* The actual editor */}
      <iframe
        // THE FIX: Use "as any" to bypass the RefObject/LegacyRef mismatch
        ref={editorIframeRef as any}
        src={editorSrc}
        title="WebGLStudio Editor"
        className="h-full w-full flex-1 border-0"
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
        // Required for 3D/WebGL engine access
        allow="fullscreen; clipboard-read; clipboard-write; xr-spatial-tracking"
      />
    </div>
  );
}
