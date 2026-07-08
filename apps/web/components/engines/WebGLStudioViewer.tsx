'use client';

import { useEffect, useRef, useState } from 'react';
import { engineManager } from '@engine/core';

interface WebGLStudioViewerProps {
  initialShader?: string;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export default function WebGLStudioViewer({ 
  initialShader = 'precision mediump float;\nvoid main() {\n  gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0);\n}',
  onReady,
  onError
}: WebGLStudioViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engineLoaded, setEngineLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initWebGL = async () => {
      if (!canvasRef.current) return;

      try {
        // Load engine via EngineManager
        await engineManager.loadEngine('webgl', {
          canvas: canvasRef.current,
        });

        if (!mounted) return;
        
        setEngineLoaded(true);
        onReady?.();

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize WebGL';
        console.error('[WebGLStudioViewer] Error:', errorMsg);
        if (mounted) {
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initWebGL();

    return () => {
      mounted = false;
      // EngineManager.handle cleanup automatically
      engineManager.dispose();
    };
  }, [onReady, onError]);

  return (
    <div className="w-full h-full relative bg-black/50">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: 'none' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-green-400 font-mono">Loading WebGL Engine...</p>
            <p className="text-green-300/60 text-sm mt-2">Compiling shader</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 border-2 border-red-500/30 rounded">
          <div className="text-center p-4 max-w-xs">
            <p className="text-red-400 font-bold mb-2">WebGL Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {!isLoading && !error && engineLoaded && (
        <div className="absolute top-2 right-2 bg-green-500/20 backdrop-blur border border-green-500/30 rounded px-3 py-1">
          <span className="text-green-400 text-xs font-mono">🟢 WebGL Ready</span>
        </div>
      )}
    </div>
  );
}