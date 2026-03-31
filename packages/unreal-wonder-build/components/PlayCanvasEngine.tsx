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

export default function PlayCanvasEngineFallbackNotice() {
  return (
    <div className="rounded-md border border-amber-400/40 bg-amber-400/10 p-4 text-amber-100">
      <p className="text-sm font-semibold">PlayCanvas runtime moved to fallback vault</p>
      <p className="mt-1 text-xs opacity-80">TODO: Fallback: This logic moved to _FALLBACK_VAULT.</p>
    </div>
  );
}
