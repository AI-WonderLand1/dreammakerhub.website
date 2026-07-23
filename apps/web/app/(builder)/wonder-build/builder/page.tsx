'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSovereignOS } from '../context/SovereignOSContext';
import { SovereignOSProvider } from '../context/SovereignOSContext';
import { SovereignNavBar } from '../components/SovereignNavBar';
import { CloudSandboxPanel } from '../components/CloudSandboxPanel';
import { PlaygroundPanel } from '../components/PlaygroundPanel';
import { useBuilderStore } from '@/lib/builder/store';
import type { CanvasElement } from '@/lib/builder/types';
import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';

const VisualBuilderCanvas = dynamic(() => import('@/lib/builder/components/VisualBuilderCanvas'), { ssr: false });
const ComponentLibrary = dynamic(() => import('@/lib/builder/components/ComponentLibrary'), { ssr: false });
const InspectorPanel = dynamic(() => import('@/lib/builder/components/InspectorPanel'), { ssr: false });
const LayersPanel = dynamic(() => import('@/lib/builder/components/LayersPanel'), { ssr: false });
const ResponsiveControls = dynamic(() => import('@/lib/builder/components/ResponsiveControls'), { ssr: false });

type BuilderTab = 'code' | 'design' | 'preview';

function BuilderContent() {
  const { editorCode, setEditorCode } = useSovereignOS();
  const {
    setElements, leftPanelOpen, setLeftPanelOpen, leftPanelTab, setLeftPanelTab,
    rightPanelOpen, setRightPanelOpen, showGrid, setShowGrid, snapToGrid, setSnapToGrid,
    undo, redo, zoom, setZoom,
  } = useBuilderStore();
  const [tab, setTab] = useState<BuilderTab>('design');
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const pendingCode = sessionStorage.getItem('pendingBuilderCode');
    if (pendingCode) {
      setEditorCode(pendingCode);
      sessionStorage.removeItem('pendingBuilderCode');
      setImported(true);
    }
  }, [setEditorCode]);

  const handleImportToCanvas = useCallback(() => {
    if (!editorCode) return;
    const el: CanvasElement = {
      id: `imported-${Date.now()}`,
      type: 'custom-html',
      name: 'Imported HTML',
      icon: '📄',
      props: { html: editorCode },
      styles: { padding: '1rem' },
    };
    setElements([el]);
  }, [editorCode, setElements]);

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <a href="/wonder-build" className="text-xs text-white/40 hover:text-white transition-colors">← Hub</a>
          <span className="text-white/20">/</span>
          <span className="text-xs font-semibold text-white/80">Builder</span>
        </div>
        <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
          <button onClick={() => setTab('code')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'code' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            💻 Code
          </button>
          <button onClick={() => setTab('design')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'design' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            🎨 Design
          </button>
          <button onClick={() => setTab('preview')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'preview' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            👁️ Preview
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <SovereignNavBar />
        <div className="h-full" style={{ paddingTop: '48px' }}>
          {tab === 'code' && (
            <div className="h-full max-w-[48rem] mx-auto">
              <CloudSandboxPanel />
            </div>
          )}

          {tab === 'design' && (
            <div className="flex h-full flex-col">
              {/* Secondary toolbar */}
              <div className="shrink-0 flex items-center justify-between border-b border-white/10 bg-[#0b0f19] px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${leftPanelOpen ? 'bg-purple-600/20 text-purple-300' : 'text-white/40 hover:text-white'}`}
                  >
                    {leftPanelOpen ? '◀ Hide' : '▶ Blocks'}
                  </button>
                  <span className="text-white/20 mx-1">|</span>
                  <button onClick={undo} className="px-1.5 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/5" title="Undo">↩</button>
                  <button onClick={redo} className="px-1.5 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/5" title="Redo">↪</button>
                  <span className="text-white/20 mx-1">|</span>
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${showGrid ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${snapToGrid ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                  >
                    Snap
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30">{Math.round(zoom * 100)}%</span>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={Math.round(zoom * 100)}
                    onChange={(e) => setZoom(Number(e.target.value) / 100)}
                    className="w-20 h-1 accent-purple-500"
                  />
                  {imported && (
                    <button
                      onClick={handleImportToCanvas}
                      className="rounded bg-emerald-600/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      Import code →
                    </button>
                  )}
                </div>
              </div>

              {/* Main canvas area with drawers */}
              <div className="flex flex-1 overflow-hidden relative">
                {/* Left drawer */}
                {leftPanelOpen && (
                  <div className="shrink-0 border-r border-white/10">
                    <div className="flex border-b border-white/10">
                      {(['blocks', 'layers', 'templates'] as const).map((tabName) => (
                        <button
                          key={tabName}
                          onClick={() => setLeftPanelTab(tabName)}
                          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                            leftPanelTab === tabName ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {tabName === 'blocks' ? '🧱 Blocks' : tabName === 'layers' ? '📋 Layers' : '📄 Templates'}
                        </button>
                      ))}
                    </div>
                    {leftPanelTab === 'blocks' && <ComponentLibrary />}
                    {leftPanelTab === 'layers' && <LayersPanel />}
                    {leftPanelTab === 'templates' && (
                      <div className="w-72 h-full bg-[#0b0f19] p-4 text-center text-xs text-white/30 flex items-center justify-center">
                        Template library coming soon.
                      </div>
                    )}
                  </div>
                )}

                {/* Canvas */}
                <div className="flex-1 overflow-hidden relative">
                  <VisualBuilderCanvas />
                </div>

                {/* Right drawer */}
                {rightPanelOpen && <InspectorPanel />}
              </div>
            </div>
          )}

          {tab === 'preview' && (
            <PlaygroundPanel />
          )}
        </div>
      </div>
    </>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Builder...</div>}>
      <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
        <SovereignOSProvider>
          <BuilderContent />
        </SovereignOSProvider>
      </div>
    </Suspense>
  );
}
