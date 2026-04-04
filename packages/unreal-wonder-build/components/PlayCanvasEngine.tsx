'use client';

import { useEffect, useRef, useState } from 'react';
// import * as pc from 'playcanvas';
// TODO: Fallback: This logic moved to _FALLBACK_VAULT.

type EngineStatus = 'loading' | 'empty' | 'ready' | 'error';

type PlayCanvasEngineProps = {
  assetUrl?: string;
};

export default function PlayCanvasEngine({ assetUrl }: PlayCanvasEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<EngineStatus>(assetUrl ? 'loading' : 'empty');

  useEffect(() => {
    if (!assetUrl) {
      setStatus('empty');
      return;
    }
    setStatus('ready');
  }, [assetUrl]);

  return (
    <div className="space-y-3">
      {status === 'empty' && (
        <p className="text-xs text-zinc-400">Upload an asset to preview it in the 3D scene viewer.</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400">PlayCanvas failed to initialize in this environment.</p>
      )}
      <canvas
        ref={canvasRef}
        className="h-[320px] w-full rounded-md border border-zinc-700/50 bg-zinc-950"
        aria-label="3D scene preview canvas"
      />
      <PlayCanvasEngineFallbackNotice />
    </div>
  );
}

export function PlayCanvasEngineFallbackNotice() {
  return (
    <div className="rounded-md border border-amber-400/40 bg-amber-400/10 p-4 text-amber-100">
      <p className="text-sm font-semibold">PlayCanvas runtime moved to fallback vault</p>
      <p className="mt-1 text-xs opacity-80">TODO: Fallback: This logic moved to _FALLBACK_VAULT.</p>
    </div>
  );
}
