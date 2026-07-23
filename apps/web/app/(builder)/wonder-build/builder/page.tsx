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
  const { setElements } = useBuilderStore();
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
      type: 'html-block',
      name: 'Imported HTML',
      props: { content: editorCode },
      styles: { padding: '1rem' },
    };
    setElements([el]);
  }, [editorCode, setElements]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <a href="/wonder-build" className="text-xs text-white/40 hover:text-white transition-colors">← Hub</a>
          <span className="text-white/20">/</span>
          <span className="text-xs font-semibold text-white/80">Builder</span>
        </div>
        <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setTab('code')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'code' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            💻 Code
          </button>
          <button
            onClick={() => setTab('design')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'design' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            🎨 Design
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'preview' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
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
              <ResponsiveControls />
              <div className="flex flex-1 overflow-hidden">
                <div className="flex flex-col">
                  <ComponentLibrary />
                </div>
                {imported && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
                    <button
                      onClick={handleImportToCanvas}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                    >
                      Import code to canvas
                    </button>
                  </div>
                )}
                <div className="flex flex-col flex-1">
                  <VisualBuilderCanvas />
                </div>
                <div className="flex flex-col">
                  <LayersPanel />
                  <InspectorPanel />
                </div>
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
