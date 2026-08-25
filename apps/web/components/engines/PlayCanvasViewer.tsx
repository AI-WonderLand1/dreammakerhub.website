'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { engineManager } from '@engine/core';
import { logger } from '@/lib/logger';

// Dynamic import for PlayCanvas (client-side only)
const pc: any = null;

interface PlayCanvasViewerProps {
  onSceneReady?: (app: any) => void;
  onEntitySelect?: (entity: any) => void;
}

export default function PlayCanvasViewer({ 
  onSceneReady, 
  onEntitySelect 
}: PlayCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [stats, setStats] = useState({ fps: 0, entities: 0 });

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    if (!appRef.current) return;
    const camera = appRef.current.root.findByName('Camera');
    if (camera) {
      const pos = camera.getPosition();
      camera.setPosition(pos.x, pos.y, pos.z * 0.9);
      setZoom(prev => Math.min(prev * 1.1, 3));
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!appRef.current) return;
    const camera = appRef.current.root.findByName('Camera');
    if (camera) {
      const pos = camera.getPosition();
      camera.setPosition(pos.x, pos.y, pos.z * 1.1);
      setZoom(prev => Math.max(prev * 0.9, 0.3));
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (!appRef.current) return;
    const camera = appRef.current.root.findByName('Camera');
    if (camera) {
      camera.setPosition(0, 2, 5);
      camera.lookAt(0, 0, 0);
      setZoom(1);
    }
   }, []);

   // Create dummy handlers for the Viewer's UI controls
   const updateStats = useCallback(() => {
     setStats(prev => ({
       fps: Math.max(0, prev.fps - 1),
       entities: Math.max(0, prev.entities - 1),
     }));
   }, []);

   const updateZoom = useCallback((delta: number) => {
     setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
   }, []);

   const updateGrid = useCallback(() => {
     setShowGrid(prev => !prev);
   }, []);

  useEffect(() => {
    let mounted = true;
    let animationFrameId: number | undefined;

    const initPlayCanvas = async () => {
      try {
        // Use EngineManager instead of direct instantiation
        if (!canvasRef.current) return;

        // Load engine via EngineManager
        await engineManager.loadEngine('playcanvas', {
          canvas: canvasRef.current,
          onFrame: (time: number) => {
            // Update stats from the active engine
            if (engineManager.getActiveEngineName() === 'playcanvas') {
              const activeEngine = engineManager['active'];
              if (activeEngine?.context) {
                setStats(prev => ({
                  fps: Math.round(1000 / (activeEngine.context as any)._frameTime || 16),
                  entities: activeEngine.root?.children?.length || 0,
                }));
              }
            }
          },
          onReady: () => {
            setIsLoading(false);
            onSceneReady?.(null); // EngineManager creates the app
          },
          onError: (err: Error) => {
            setError(err.message);
          }
        });

        if (!mounted) return;
        logger.info('[PlayCanvasViewer] Engine initialized via EngineManager');

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize PlayCanvas';
        logger.error('[PlayCanvasViewer] Error:', errorMsg);
        if (mounted) {
          setError(errorMsg);
        }
      }
    };

    initPlayCanvas();

    return () => {
      mounted = false;
      // EngineManager handles cleanup automatically
      if (engineManager.getActiveEngineName() === 'playcanvas') {
        engineManager.dispose();
      }
    };
  }, [onSceneReady, onEntitySelect]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-500/10 border border-red-500/30 rounded">
        <div className="text-center p-4">
          <p className="text-red-400 font-bold mb-2">Failed to load 3D Engine</p>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-900 to-black">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cyan-400">Loading 3D Engine...</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur border border-cyan-500/30 rounded-lg px-3 py-2 z-10">
        <button 
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-white/80"
          title="Zoom Out"
        >
          −
        </button>
        <span className="text-xs text-white/60 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button 
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-white/80"
          title="Zoom In"
        >
          +
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button 
          onClick={handleResetView}
          className="px-3 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded"
          title="Reset View"
        >
          Reset
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button 
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1 text-xs rounded ${showGrid ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}
          title="Toggle Grid"
        >
          Grid
        </button>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur border border-white/10 rounded px-3 py-2 text-xs text-white/60 z-10">
          <div>FPS: {stats.fps}</div>
          <div>Entities: {stats.entities}</div>
          <div className="text-cyan-400 mt-1">🖱️ Drag to rotate | Scroll to zoom</div>
        </div>
      )}

      {/* The Canvas - Infinite workspace feel */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-move"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}