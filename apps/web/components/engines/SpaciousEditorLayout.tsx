'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { UserAssetLibrary } from './UserAssetLibrary';
import { AIAssistantPanel } from './AIAssistantPanel';

// Dynamic import for heavy 3D engine
const PlayCanvasViewer = dynamic(() => import('./PlayCanvasViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black/50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cyan-400 text-lg">Loading 3D Engine...</p>
      </div>
    </div>
  ),
});

export default function SpaciousEditorLayout() {
  const [showAI, setShowAI] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showWiring, setShowWiring] = useState(false);
  const [playCanvasApp, setPlayCanvasApp] = useState<any>(null);

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Spacious Header */}
      <header className="h-20 border-b border-cyan-500/30 px-8 py-5 bg-black/50 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-blue-400 mb-1">🎮 WonderSpace 3D Editor</h1>
          <p className="text-base text-white/60">Create • Build • Publish</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Toggle panels */}
          <button 
            onClick={() => setShowAssets(!showAssets)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              showAssets ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-white/60'
            }`}
          >
            📚 Assets
          </button>
          <button 
            onClick={() => setShowAI(!showAI)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              showAI ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-white/60'
            }`}
          >
            🤖 AI
          </button>
          <button 
            onClick={() => setShowWiring(!showWiring)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              showWiring ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-white/60'
            }`}
          >
            🔌 Wiring
          </button>
          
          <div className="w-px h-8 bg-white/20 mx-2" />
          
          <button className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-base">
            Save Scene
          </button>
          <button className="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg text-base">
            Publish
          </button>
        </div>
      </header>

      {/* Main Content - Room for everything */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: User Assets Panel */}
        {showAssets && (
          <aside className="w-72 border-r border-cyan-500/30 bg-black/20 flex flex-col shrink-0">
            <UserAssetLibrary />
          </aside>
        )}

        {/* Center: Infinite Canvas */}
        <main className="flex-1 relative overflow-hidden">
          <PlayCanvasViewer 
            onSceneReady={setPlayCanvasApp}
            onEntitySelect={(entity) => console.log('Selected:', entity)}
          />
          
          {/* Overlay instructions */}
          <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur border border-white/10 rounded-lg px-4 py-3 text-sm text-white/60 pointer-events-none">
            <p className="font-medium text-white mb-1">Controls:</p>
            <p>🖱️ Drag to rotate • Scroll to zoom</p>
            <p>👆 Click objects to select</p>
            <p>🌐 Infinite workspace</p>
          </div>
        </main>

        {/* Right: AI Assistant Panel */}
        {showAI && (
          <aside className="w-[420px] border-l border-cyan-500/30 bg-black/30 flex flex-col shrink-0">
            <AIAssistantPanel />
          </aside>
        )}
      </div>

      {/* Bottom: Wiring Panel (collapsible) */}
      {showWiring && (
        <div className="h-52 border-t border-cyan-500/30 bg-black/20 p-5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-green-400">🔌 Node Wiring</h3>
            <button 
              onClick={() => setShowWiring(false)}
              className="text-white/40 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-white/60">Connect nodes, shaders, and logic here...</p>
          <div className="mt-4 p-8 border-2 border-dashed border-white/10 rounded-lg text-center text-white/40">
            Wiring canvas - drag to connect nodes
          </div>
        </div>
      )}
    </div>
  );
}
