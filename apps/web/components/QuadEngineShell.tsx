'use client';

/**
 * QuadEngineShell - Main Component for AI-WONDERLAND
 * Manages 4 engines: PlayCanvas (3D), WebGL Studio (Shaders), Puck (UI), Theia IDE (Code)
 * Uses next/dynamic with ssr: false for optimal performance
 */

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import '../styles/tie-dye-neon.css';
import { PAGES, getPagesByCategory } from '../lib/navigation';

// Dynamically import engines with ssr: false to prevent server-side issues
const PlayCanvasEngine = dynamic(() => import('./engines/PlayCanvasEngine'), {
  ssr: false,
  loading: () => <EngineLoader engine="PlayCanvas" />,
});

const WebGLStudioEngine = dynamic(() => import('./engines/WebGLStudioEngine'), {
  ssr: false,
  loading: () => <EngineLoader engine="WebGL Studio" />,
});

const PuckUIEngine = dynamic(() => import('./engines/PuckUIEngine'), {
  ssr: false,
  loading: () => <EngineLoader engine="Puck" />,
});

const TheiaIDEEngine = dynamic(() => import('./engines/TheiaIDEEngine'), {
  ssr: false,
  loading: () => <EngineLoader engine="Theia" />,
});

type EngineType = 'playcanvas' | 'webgl' | 'puck' | 'theia';

interface EngineConfig {
  id: EngineType;
  label: string;
  color: string;
  icon: string;
  component: React.ComponentType<any>;
}

const ENGINES: EngineConfig[] = [
  {
    id: 'playcanvas',
    label: 'PlayCanvas 3D',
    color: '#0066ff',
    icon: '🎮',
    component: PlayCanvasEngine,
  },
  {
    id: 'webgl',
    label: 'WebGL Studio',
    color: '#00ff00',
    icon: '✨',
    component: WebGLStudioEngine,
  },
  {
    id: 'puck',
    label: 'Puck UI',
    color: '#ff00ff',
    icon: '📐',
    component: PuckUIEngine,
  },
  {
    id: 'theia',
    label: 'Theia IDE',
    color: '#ff0055',
    icon: '💻',
    component: TheiaIDEEngine,
  },
];

function EngineLoader({ engine }: { engine: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black via-black to-black">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-cyan-500 font-mono text-sm">Loading {engine}...</p>
      </div>
    </div>
  );
}

export function QuadEngineShell() {
  const [activeEngine, setActiveEngine] = useState<EngineType>('playcanvas');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [storageMode, setStorageMode] = useState<'supabase' | 'byoc' | 'hybrid'>('supabase');
  const [engineStates, setEngineStates] = useState<Record<EngineType, any>>({
    playcanvas: null,
    webgl: null,
    puck: null,
    theia: null,
  });

  const currentEngine = ENGINES.find((e) => e.id === activeEngine)!;
  const CurrentEngineComponent = currentEngine.component;

  const handleEngineSwitch = useCallback((engineId: EngineType) => {
    setActiveEngine(engineId);
  }, []);

  const handleSaveEngineState = useCallback((engineId: EngineType, state: any) => {
    setEngineStates((prev) => ({ ...prev, [engineId]: state }));
  }, []);

  useEffect(() => {
    // Keyboard shortcut to toggle sidebar
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar */}
      <nav
        className={`sidebar-container transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col border-r-2 border-blue-500/50`}
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-blue-500/30">
          <h1
            className={`cyberpunk-text text-sm ${
              isSidebarOpen ? 'block' : 'hidden'
            } text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-blue-500 to-green-500`}
          >
            AI-WONDERLAND
          </h1>
          <div className="text-yellow-400 text-xs mt-1 font-mono">
            {isSidebarOpen ? 'v1.0' : 'v'}
          </div>
        </div>

        {/* Engine List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {ENGINES.map((engine) => (
            <button
              key={engine.id}
              onClick={() => handleEngineSwitch(engine.id)}
              className={`sidebar-item w-full text-left text-sm font-mono transition-all ${
                activeEngine === engine.id
                  ? 'active neon-glow-secondary'
                  : 'text-white/60 hover:text-white'
              }`}
              title={engine.label}
            >
              <span className="mr-2">{engine.icon}</span>
              {isSidebarOpen && <span>{engine.label}</span>}
            </button>
          ))}
        </div>

        {/* Storage Mode Indicator */}
        <div
          className={`p-3 border-t-2 border-blue-500/30 text-xs font-mono ${
            storageMode === 'supabase'
              ? 'storage-mode-supabase'
              : storageMode === 'byoc'
                ? 'storage-mode-byoc'
                : 'storage-mode-hybrid'
          }`}
        >
          {isSidebarOpen ? (
            <>
              <div className="text-white/70">Storage:</div>
              <div className="font-bold mt-1">
                {storageMode === 'supabase'
                  ? '☁️ Supabase'
                  : storageMode === 'byoc'
                    ? '🔐 BYOC'
                    : '⚡ Hybrid'}
              </div>
            </>
          ) : (
            <div className="text-center">
              {storageMode === 'supabase' ? '☁️' : storageMode === 'byoc' ? '🔐' : '⚡'}
            </div>
          )}
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="w-full p-3 border-t-2 border-blue-500/30 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {isSidebarOpen ? '◄' : '►'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-black via-black to-black">
        {/* Global Navigation Header */}
        <header className="border-b-4 border-cyan-500/50 bg-black/90 backdrop-blur">
          {/* Top Navigation Bar */}
          <div className="p-3 flex items-center justify-between border-b border-blue-500/30 bg-black/50">
            <div className="flex items-center gap-3">
              <div
                className="engine-active w-4 h-4 rounded-full"
                style={{ boxShadow: `0 0 15px ${currentEngine.color}` }}
              />
              <span className="cyberpunk-text text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-blue-500 to-green-500">
                AI-WONDERLAND
              </span>
              <span className="text-xs text-cyan-400 font-mono ml-2">
                {currentEngine.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/" className="px-3 py-1 rounded text-xs hover:bg-cyan-500/20 transition">
                🏠 Home
              </Link>
              <a href="/play" className="px-3 py-1 rounded text-xs hover:bg-green-500/20 transition">
                ▶️ Play
              </a>
              <a href="/marketplace" className="px-3 py-1 rounded text-xs hover:bg-purple-500/20 transition">
                🛍️ Marketplace
              </a>
              <a href="/community" className="px-3 py-1 rounded text-xs hover:bg-pink-500/20 transition">
                👥 Community
              </a>
              <a href="/docs" className="px-3 py-1 rounded text-xs hover:bg-yellow-500/20 transition">
                📖 Docs
              </a>
              <a href="/support" className="px-3 py-1 rounded text-xs hover:bg-red-500/20 transition">
                💬 Support
              </a>

              <div className="ml-4 border-l border-white/20 pl-4 flex gap-2">
                <button className="neon-button px-3 py-1 text-xs" title="Settings (Ctrl+,)">
                  ⚙️
                </button>
                <button className="neon-button px-3 py-1 text-xs" title="Save Project (Ctrl+S)">
                  💾
                </button>
                <button className="neon-button px-3 py-1 text-xs" title="Export (Ctrl+E)">
                  📤
                </button>
              </div>
            </div>
          </div>

          {/* Quick Navigation Tabs */}
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto bg-black/30 text-xs border-b border-blue-500/20">
            <span className="text-white/50 font-semibold">Navigate:</span>
            
            {/* Builders */}
            <div className="flex gap-1 px-2 border-r border-white/20">
              <Link href="/builder-ai" className="px-2 py-1 rounded hover:bg-blue-500/20 transition text-blue-300">
                🤖 AI Builder
              </Link>
              <Link href="/builder" className="px-2 py-1 rounded hover:bg-blue-500/20 transition text-blue-300">
                🔨 Builder
              </Link>
            </div>

            {/* Workspaces */}
            <div className="flex gap-1 px-2 border-r border-white/20">
              <a href="/(workspace)/dashboard" className="px-2 py-1 rounded hover:bg-green-500/20 transition text-green-300">
                📊 Dashboard
              </a>
              <a href="/(workspace)/projects" className="px-2 py-1 rounded hover:bg-green-500/20 transition text-green-300">
                📁 Projects
              </a>
            </div>

            {/* Tools */}
            <div className="flex gap-1 px-2 border-r border-white/20">
              <a href="/settings" className="px-2 py-1 rounded hover:bg-yellow-500/20 transition text-yellow-300">
                ⚡ Settings
              </a>
              <a href="/connect-storage" className="px-2 py-1 rounded hover:bg-yellow-500/20 transition text-yellow-300">
                ☁️ Storage
              </a>
            </div>

            {/* Learning */}
            <div className="flex gap-1 px-2">
              <a href="/tutorials" className="px-2 py-1 rounded hover:bg-purple-500/20 transition text-purple-300">
                📚 Tutorials
              </a>
              <a href="/api-reference" className="px-2 py-1 rounded hover:bg-purple-500/20 transition text-purple-300">
                📋 API Ref
              </a>
            </div>
          </div>
        </header>

        {/* Engine Container */}
        <div className="flex-1 overflow-hidden engine-container active m-2 rounded-lg">
          <CurrentEngineComponent
            engineState={engineStates[activeEngine]}
            onStateChange={(state: any) => handleSaveEngineState(activeEngine, state)}
          />
        </div>

        {/* Status Bar */}
        <footer className="border-t-2 border-blue-500/30 bg-black/80 px-4 py-2 text-xs font-mono text-white/50 flex justify-between">
          <span>🟢 All Engines Ready</span>
          <span>WebGL Memory: 256MB / 512MB</span>
          <span>FPS: 60 | Latency: 5ms</span>
        </footer>
      </main>
    </div>
  );
}
