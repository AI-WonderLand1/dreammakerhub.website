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
  const appRef = useRef<pc.Application | null>(null);
  const [status, setStatus] = useState<EngineStatus>(assetUrl ? 'loading' : 'empty');

  useEffect(() => {
    if (!assetUrl) {
      setStatus('empty');
      return;
    }

    if (!canvasRef.current || appRef.current) {
      return;
    }

    let app: pc.Application | null = null;

    try {
      app = new pc.Application(canvasRef.current!, {
        graphicsDeviceOptions: { preserveDrawingBuffer: true, antialias: true },
      });
      appRef.current = app;
      app.start();

      const camera = new pc.Entity('Camera');
      camera.addComponent('camera', { clearColor: new pc.Color(0.08, 0.08, 0.1) });
      camera.setPosition(0, 0, 3);
      app.root.addChild(camera);

      const light = new pc.Entity('Light');
      light.addComponent('light', { type: 'directional', intensity: 1.2 });
      light.setEulerAngles(35, 35, 0);
      app.root.addChild(light);

      setStatus('ready');
    } catch (error) {
      console.error('Failed to initialize PlayCanvas:', error);
      setStatus('error');
    }

    return () => {
      if (app) {
        app.destroy();
      }
      appRef.current = null;
    };
  }, [assetUrl]);

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <canvas ref={canvasRef} className="h-full w-full aspect-video" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">Loading 3D engine…</div>
      )}

      {status === 'empty' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 p-4 text-center">
          <p className="text-lg font-semibold text-white">No scene selected</p>
          <p className="text-sm text-white/70">Provide an asset URL to load WonderPlay in this surface.</p>
          <a
            href="/dashboard/editor-playcanvas"
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            Open WonderPlay Bridge
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 p-4 text-red-100" role="alert">
          Could not initialize PlayCanvas. Please refresh or open WonderPlay Bridge.
        </div>
      )}
    </div>
  );
}
