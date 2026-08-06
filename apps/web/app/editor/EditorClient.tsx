'use client';


import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';

// PlayCanvas loaded from the locally-installed package (no playcanvas.com CDN)
let pc: any = null;

export default function EditorPage() {
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // Get URL params
  const project = searchParams.get('project') || 'untitled';
  const file = searchParams.get('file');
  const isNew = searchParams.get('new') === 'true';
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [sceneObjects, setSceneObjects] = useState<any[]>([]);

  // Initialize PlayCanvas after local engine module loads
  useEffect(() => {
    let mounted = true;

    const loadEngineAndInit = async () => {
      try {
        if (!pc) {
          // Dynamic import of the locally-installed PlayCanvas engine
          const module = await import('playcanvas');
          if (!mounted) return;
          pc = (module as any);
          if (pc.default) pc = (pc.default as any);
        }
        if (!mounted) return;
        setScriptLoaded(true);
      } catch (err) {
        logger.error('Failed to load PlayCanvas engine:', err);
        if (mounted) setIsLoading(false);
      }
    };

    loadEngineAndInit();

    return () => {
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !canvasRef.current) return;

    let mounted = true;

    const initPlayCanvas = () => {
      try {
        if (!pc) {
          logger.error('PlayCanvas not loaded');
          setIsLoading(false);
          return;
        }

        if (!mounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const app = new pc.Application(canvas, {
          mouse: new pc.Mouse(canvas),
          touch: new pc.TouchDevice(canvas),
          elementInput: new pc.ElementInput(canvas)
        });

        appRef.current = app;
        app.start();

        // Resize handler
        const resize = () => {
          app.resizeCanvas();
        };
        window.addEventListener('resize', resize);
        resize(); // Initial resize

        // Create scene
        const cleanupScene = createDemoScene(app);

        setIsLoading(false);

        return () => {
          window.removeEventListener('resize', resize);
          if (cleanupScene) cleanupScene();
        };
      } catch (err) {
        logger.error('Failed to init PlayCanvas:', err);
        setIsLoading(false);
      }
    };

    initPlayCanvas();

    return () => {
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [scriptLoaded]);  const createDemoScene = (app: any): (() => void) | void => {
    // Camera
    const camera = new pc.Entity('Camera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.05, 0.05, 0.08)
    });
    camera.setPosition(0, 3, 8);
    camera.lookAt(0, 0, 0);
    app.root.addChild(camera);

    // Light
    const light = new pc.Entity('Light');
    light.addComponent('light', {
      type: 'directional',
      intensity: 1
    });
    light.setEulerAngles(45, 30, 0);
    app.root.addChild(light);

    // Demo cube
    const cube = new pc.Entity('Cube');
    cube.addComponent('render', { type: 'box' });
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.2, 0.6, 1);
    material.update();
    cube.render.material = material;
    app.root.addChild(cube);

    // Ground
    const ground = new pc.Entity('Ground');
    ground.addComponent('render', { type: 'plane' });
    ground.setLocalScale(20, 1, 20);
    ground.setPosition(0, -1, 0);
    const groundMat = new pc.StandardMaterial();
    groundMat.diffuse = new pc.Color(0.1, 0.1, 0.15);
    groundMat.update();
    ground.render.material = groundMat;
    app.root.addChild(ground);

    // Animation
    const updateHandler = (dt: number) => {
      cube.rotate(10 * dt, 20 * dt, 0);
    };
    app.on('update', updateHandler);

    // Track objects
    setSceneObjects([cube, ground, camera, light]);
    
    // Return cleanup function
    return () => {
      app.off('update', updateHandler);
    };
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      
      {/* Header */}
      <header className="h-16 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <img src="/images/logo.png" alt="WonderSpace" className="h-8 w-auto cursor-pointer" />
          </Link>
          <div className="h-6 w-px bg-[#30363d]" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#58a6ff]">{project}</span>
            {file && (
              <>
                <span className="text-gray-500">/</span>
                <span className="text-gray-300">{file}</span>
              </>
            )}
            {isNew && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">NEW</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAssets(!showAssets)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              showAssets ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            📁 Files
          </button>
          <button 
            onClick={() => setShowAI(!showAI)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              showAI ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            🤖 AI
          </button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium">
            💾 Save
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">
            ▶️ Preview
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: File Browser */}
        {showAssets && (
          <aside className="w-72 border-r border-[#30363d] bg-[#161b22] flex flex-col shrink-0">
            <div className="p-4 border-b border-[#30363d]">
              <h2 className="font-semibold text-white">📁 Project Files</h2>
              <p className="text-xs text-gray-500 mt-1">{project}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-[#21262d] rounded cursor-pointer">
                  <span>📁</span>
                  <span>src</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-[#21262d] rounded cursor-pointer">
                  <span>📁</span>
                  <span>assets</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-[#21262d] rounded cursor-pointer bg-blue-500/10">
                  <span>📄</span>
                  <span className="text-blue-400">scene.json</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-[#21262d] rounded cursor-pointer">
                  <span>📄</span>
                  <span>README.md</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Center: 3D Viewport */}
        <main className="flex-1 relative bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-blue-400">Loading 3D Engine...</p>
              </div>
            </div>
          )}
          
          <canvas 
            ref={canvasRef} 
            width={800}
            height={600}
            className="w-full h-full block cursor-move"
            style={{ touchAction: 'none' }}
          />

          {/* Viewport Controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-sm hover:bg-[#21262d]">
              👁️ Viewport
            </button>
            <button className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-sm hover:bg-[#21262d]">
              🎮 Game
            </button>
          </div>

          {/* Scene Stats */}
          <div className="absolute bottom-4 left-4 bg-[#161b22]/80 backdrop-blur border border-[#30363d] rounded px-3 py-2 text-xs text-gray-400">
            <p>Objects: {sceneObjects.length}</p>
            <p>FPS: 60</p>
          </div>

          {/* Controls Help */}
          <div className="absolute bottom-4 right-4 bg-[#161b22]/80 backdrop-blur border border-[#30363d] rounded px-4 py-3 text-sm text-gray-400">
            <p className="font-medium text-white mb-1">Controls:</p>
            <p>🖱️ Left drag: Rotate</p>
            <p>🖱️ Right drag: Pan</p>
            <p>📜 Scroll: Zoom</p>
          </div>
        </main>

        {/* Right: AI Panel */}
        {showAI && (
          <aside className="w-96 border-l border-[#30363d] bg-[#161b22] flex flex-col shrink-0">
            <div className="p-4 border-b border-[#30363d]">
              <h2 className="font-semibold text-white">🤖 WonderAI</h2>
              <p className="text-xs text-gray-500 mt-1">Your 3D assistant</p>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-[#21262d] rounded-lg p-3">
                <p className="text-sm text-gray-300">👋 Hi! I'm WonderAI. I can help you build 3D scenes.</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-400 mb-1">💡 Try asking:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• "Add a red cube"</li>
                  <li>• "Make it rotate faster"</li>
                  <li>"Add lighting"</li>
                </ul>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#30363d]">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask AI to build..."
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                  Send
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
