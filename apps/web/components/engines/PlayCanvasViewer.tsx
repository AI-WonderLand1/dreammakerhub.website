'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Dynamic import for PlayCanvas (client-side only)
let pc: any = null;

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

  useEffect(() => {
    let mounted = true;
    let animationFrameId: number;

    const initPlayCanvas = async () => {
      try {
        // Dynamically import PlayCanvas
        if (!pc) {
          const playcanvas = await import('playcanvas');
          pc = playcanvas;
        }

        if (!mounted || !canvasRef.current || !containerRef.current) return;

        // Create PlayCanvas application
        const canvas = canvasRef.current;
        const app = new pc.Application(canvas, {
          mouse: new pc.Mouse(canvas),
          touch: new pc.TouchDevice(canvas),
          elementInput: new pc.ElementInput(canvas)
        });

        appRef.current = app;

        // Set canvas to fill container (responsive)
        app.setCanvasFillMode(pc.FILLMODE_NONE);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);

        // Start the application
        app.start();

        // Initial resize
        const resize = () => {
          if (containerRef.current && canvasRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            canvasRef.current.width = rect.width;
            canvasRef.current.height = rect.height;
            app.resizeCanvas(rect.width, rect.height);
          }
        };
        resize();

        // Create camera
        const camera = new pc.Entity('Camera');
        camera.addComponent('camera', {
          clearColor: new pc.Color(0.08, 0.08, 0.12), // Dark blue-gray background
          fov: 45,
          nearClip: 0.1,
          farClip: 1000
        });
        camera.setPosition(0, 3, 8);
        camera.lookAt(0, 0, 0);
        app.root.addChild(camera);

        // Create light
        const light = new pc.Entity('Light');
        light.addComponent('light', {
          type: 'directional',
          color: new pc.Color(1, 1, 1),
          intensity: 1,
          castShadows: true
        });
        light.setEulerAngles(45, 30, 0);
        app.root.addChild(light);

        // Create ambient light
        const ambientLight = new pc.Entity('Ambient');
        ambientLight.addComponent('light', {
          type: 'point',
          color: new pc.Color(0.4, 0.4, 0.5),
          intensity: 0.6,
          range: 100
        });
        ambientLight.setPosition(5, 10, 5);
        app.root.addChild(ambientLight);

        // Create a demo cube with better material
        const cube = new pc.Entity('Demo Cube');
        cube.addComponent('render', {
          type: 'box'
        });
        
        // Create nice material
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.2, 0.6, 1);
        material.shininess = 60;
        material.metalness = 0.3;
        material.useMetalness = true;
        material.update();
        
        if (cube.render) {
          cube.render.material = material;
        }
        
        app.root.addChild(cube);

        // Add rotation script
        app.on('update', (dt: number) => {
          cube.rotate(15 * dt, 25 * dt, 0);
        });

        // Create ground plane
        const ground = new pc.Entity('Ground');
        ground.addComponent('render', {
          type: 'plane'
        });
        ground.setLocalScale(20, 1, 20);
        ground.setPosition(0, -1, 0);
        
        const groundMaterial = new pc.StandardMaterial();
        groundMaterial.diffuse = new pc.Color(0.15, 0.15, 0.2);
        groundMaterial.update();
        
        if (ground.render) {
          ground.render.material = groundMaterial;
        }
        
        app.root.addChild(ground);

        // Add grid helper (visual only)
        const grid = new pc.Entity('Grid');
        grid.setLocalScale(20, 1, 20);
        grid.setPosition(0, -0.99, 0);
        app.root.addChild(grid);

        // Mouse orbit controls
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        let cameraDistance = 8;
        let cameraAzimuth = 45;
        let cameraElevation = 30;

        app.mouse.on(pc.EVENT_MOUSEDOWN, (event: any) => {
          if (event.button === pc.MOUSEBUTTON_LEFT) {
            isDragging = true;
            lastMouseX = event.x;
            lastMouseY = event.y;
          }
        });

        app.mouse.on(pc.EVENT_MOUSEUP, () => {
          isDragging = false;
        });

        app.mouse.on(pc.EVENT_MOUSEMOVE, (event: any) => {
          if (isDragging) {
            const dx = event.x - lastMouseX;
            const dy = event.y - lastMouseY;
            
            cameraAzimuth -= dx * 0.3;
            cameraElevation = Math.max(5, Math.min(85, cameraElevation - dy * 0.3));
            
            const phi = cameraElevation * pc.math.DEG_TO_RAD;
            const theta = cameraAzimuth * pc.math.DEG_TO_RAD;
            
            camera.setPosition(
              cameraDistance * Math.sin(phi) * Math.sin(theta),
              cameraDistance * Math.cos(phi),
              cameraDistance * Math.sin(phi) * Math.cos(theta)
            );
            camera.lookAt(0, 0, 0);
            
            lastMouseX = event.x;
            lastMouseY = event.y;
          }
        });

        app.mouse.on(pc.EVENT_MOUSEWHEEL, (event: any) => {
          cameraDistance = Math.max(2, Math.min(50, cameraDistance - event.wheel * 0.5));
          const phi = cameraElevation * pc.math.DEG_TO_RAD;
          const theta = cameraAzimuth * pc.math.DEG_TO_RAD;
          
          camera.setPosition(
            cameraDistance * Math.sin(phi) * Math.sin(theta),
            cameraDistance * Math.cos(phi),
            cameraDistance * Math.sin(phi) * Math.cos(theta)
          );
          camera.lookAt(0, 0, 0);
        });

        // Handle window resize
        window.addEventListener('resize', resize);

        // Update stats
        const updateStats = () => {
          const entities = app.root.children.length;
          setStats({ fps: Math.round(1000 / (app._frameTime || 16)), entities });
          animationFrameId = requestAnimationFrame(updateStats);
        };
        updateStats();

        setIsLoading(false);
        onSceneReady?.(app);

        return () => {
          window.removeEventListener('resize', resize);
        };
      } catch (err) {
        console.error('Failed to initialize PlayCanvas:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    initPlayCanvas();

    return () => {
      mounted = false;
      cancelAnimationFrame(animationFrameId);
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
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
