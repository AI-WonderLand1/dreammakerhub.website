'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSovereignOS } from '../context/SovereignOSContext';
import { SovereignOSProvider } from '../context/SovereignOSContext';
import { SovereignNavBar } from '../components/SovereignNavBar';
import { CloudSandboxPanel } from '../components/CloudSandboxPanel';
import { PlaygroundPanel } from '../components/PlaygroundPanel';
import { useBuilderStore } from '@/lib/builder/store';
import type { CanvasElement } from '@/lib/builder/types';
import { parseHtmlToElements, isHtmlString } from '@/lib/builder/html-parser';
import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';

const VisualBuilderCanvas = dynamic(() => import('@/lib/builder/components/VisualBuilderCanvas'), { ssr: false });
const ComponentLibrary = dynamic(() => import('@/lib/builder/components/ComponentLibrary'), { ssr: false });
const InspectorPanel = dynamic(() => import('@/lib/builder/components/InspectorPanel'), { ssr: false });
const LayersPanel = dynamic(() => import('@/lib/builder/components/LayersPanel'), { ssr: false });
const ResponsiveControls = dynamic(() => import('@/lib/builder/components/ResponsiveControls'), { ssr: false });
const AccessibilityBar = dynamic(() => import('@/lib/builder/components/AccessibilityBar'), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import('@/lib/builder/components/KeyboardShortcutsModal'), { ssr: false });
const AccessibilityCheckerPanel = dynamic(() => import('@/lib/builder/components/AccessibilityCheckerPanel'), { ssr: false });
const TemplatesPanel = dynamic(() => import('@/lib/builder/components/TemplatesPanel'), { ssr: false });

type BuilderTab = 'code' | 'design' | 'preview';

function BuilderContent() {
  const { editorCode, setEditorCode } = useSovereignOS();
  const {
    setElements, leftPanelOpen, setLeftPanelOpen, leftPanelTab, setLeftPanelTab,
    rightPanelOpen, setRightPanelOpen, showGrid, setShowGrid, snapToGrid, setSnapToGrid,
    undo, redo, zoom, setZoom, selectedId, elements, removeElement, selectElement,
    setShortcutsModalOpen, shortcutsModalOpen,
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

  // Persist to localStorage
  useEffect(() => {
    const unsub = useBuilderStore.subscribe((state) => {
      try {
        localStorage.setItem('aiw-builder-state', JSON.stringify({
          elements: state.elements,
          zoom: state.zoom,
          pan: state.pan,
          showGrid: state.showGrid,
          snapToGrid: state.snapToGrid,
        }));
      } catch {}
    });
    return unsub;
  }, []);

  // Save before unload
  useEffect(() => {
    const handler = () => {
      const s = useBuilderStore.getState();
      try {
        localStorage.setItem('aiw-builder-state', JSON.stringify({
          elements: s.elements,
          zoom: s.zoom,
          pan: s.pan,
          showGrid: s.showGrid,
          snapToGrid: s.snapToGrid,
        }));
      } catch {}
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsModalOpen(!shortcutsModalOpen);
        return;
      }
      if (isInput) return;
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 's': e.preventDefault(); logger.info('Save triggered'); break;
          case 'd':
            if (selectedId) {
              e.preventDefault();
              const el = elements.find((x) => x.id === selectedId);
              if (el) {
                const dup: CanvasElement = { ...el, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: `${el.name} (copy)` };
                useBuilderStore.getState().addElement(dup);
              }
            }
            break;
          case '0': e.preventDefault(); setZoom(1); break;
          case '=': case '+': e.preventDefault(); setZoom(Math.min(3, zoom + 0.1)); break;
          case '-': e.preventDefault(); setZoom(Math.max(0.1, zoom - 0.1)); break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedId) {
              e.preventDefault();
              removeElement(selectedId);
            }
            break;
          case 'Escape':
            if (shortcutsModalOpen) {
              setShortcutsModalOpen(false);
            } else if (selectedId) {
              selectElement(null);
            }
            break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, elements, undo, redo, removeElement, selectElement, zoom, setZoom, shortcutsModalOpen, setShortcutsModalOpen]);

  const handleImportToCanvas = useCallback(() => {
    if (!editorCode) return;
    if (isHtmlString(editorCode)) {
      const parsed = parseHtmlToElements(editorCode);
      if (parsed.length > 0) {
        setElements(parsed);
        logger.info(`Parsed ${parsed.length} blocks from HTML`);
        return;
      }
    }
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
      {/* Skip-to-content link */}
      <a
        href="#builder-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-purple-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-xs focus:font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        Skip to canvas content
      </a>

      {/* Top bar */}
      <header role="banner" className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <a href="/wonder-build" className="text-xs text-white/40 hover:text-white transition-colors">← Hub</a>
          <span className="text-white/20">/</span>
          <span className="text-xs font-semibold text-white/80">Builder</span>
        </div>
        <div className="flex items-center gap-2">
          <AccessibilityBar />
          <div className="flex items-center rounded-lg border border-white/10 overflow-hidden" role="tablist" aria-label="View mode">
            <button onClick={() => setTab('code')} role="tab" aria-selected={tab === 'code'}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'code' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              💻 Code
            </button>
            <button onClick={() => setTab('design')} role="tab" aria-selected={tab === 'design'}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'design' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              🎨 Design
            </button>
            <button onClick={() => setTab('preview')} role="tab" aria-selected={tab === 'preview'}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'preview' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              👁️ Preview
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <SovereignNavBar />
        <div className="h-full" style={{ paddingTop: '48px' }}>
          {tab === 'code' && (
            <div className="h-full max-w-[48rem] mx-auto" role="tabpanel" aria-label="Code editor">
              <CloudSandboxPanel />
            </div>
          )}

          {tab === 'design' && (
            <div className="flex h-full flex-col" role="tabpanel" aria-label="Design canvas">
              {/* Secondary toolbar */}
              <nav aria-label="Canvas toolbar" className="shrink-0 flex items-center justify-between border-b border-white/10 bg-[#0b0f19] px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${leftPanelOpen ? 'bg-purple-600/20 text-purple-300' : 'text-white/40 hover:text-white'}`}
                    aria-label={leftPanelOpen ? 'Hide left panel' : 'Show blocks panel'}
                  >
                    {leftPanelOpen ? '◀ Hide' : '▶ Blocks'}
                  </button>
                  <span className="text-white/20 mx-1" aria-hidden="true">|</span>
                  <button onClick={undo} className="px-1.5 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/5" title="Undo" aria-label="Undo">↩</button>
                  <button onClick={redo} className="px-1.5 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/5" title="Redo" aria-label="Redo">↪</button>
                  <span className="text-white/20 mx-1" aria-hidden="true">|</span>
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${showGrid ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    aria-pressed={showGrid}
                    aria-label="Toggle grid overlay"
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${snapToGrid ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    aria-pressed={snapToGrid}
                    aria-label="Toggle snap to grid"
                  >
                    Snap
                  </button>
                  <span className="text-white/20 mx-1" aria-hidden="true">|</span>
                  <AccessibilityCheckerPanel />
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
                    aria-label="Zoom level"
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
              </nav>

              {/* Main canvas area with drawers */}
              <div className="flex flex-1 overflow-hidden relative">
                {/* Left drawer */}
                {leftPanelOpen && (
                  <aside aria-label="Block library and layers" className="shrink-0 border-r border-white/10">
                    <nav aria-label="Panel tabs" className="flex border-b border-white/10">
                      {(['blocks', 'layers', 'templates'] as const).map((tabName) => (
                        <button
                          key={tabName}
                          onClick={() => setLeftPanelTab(tabName)}
                          role="tab"
                          aria-selected={leftPanelTab === tabName}
                          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                            leftPanelTab === tabName ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {tabName === 'blocks' ? '🧱 Blocks' : tabName === 'layers' ? '📋 Layers' : '📄 Templates'}
                        </button>
                      ))}
                    </nav>
                    <div role="tabpanel">
                      {leftPanelTab === 'blocks' && <ComponentLibrary />}
                      {leftPanelTab === 'layers' && <LayersPanel />}
                      {leftPanelTab === 'templates' && <TemplatesPanel />}
                    </div>
                  </aside>
                )}

                {/* Canvas */}
                <div id="builder-canvas" className="flex-1 overflow-hidden relative" role="main" aria-label="Design canvas">
                  <VisualBuilderCanvas />
                </div>

                {/* Right drawer */}
                {rightPanelOpen && (
                  <aside aria-label="Element inspector" className="shrink-0">
                    <InspectorPanel />
                  </aside>
                )}
              </div>
            </div>
          )}

          {tab === 'preview' && (
            <div role="tabpanel" aria-label="Preview">
              <PlaygroundPanel />
            </div>
          )}
        </div>
      </div>

      <KeyboardShortcutsModal />
    </>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Builder...</div>}>
      <div
        className="flex h-screen flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--builder-bg, #0a0a0a)',
          color: 'var(--builder-text, #ffffff)',
        }}
      >
        <style>{`
          *:focus-visible { outline: 2px solid #7c3aed !important; outline-offset: 2px !important; border-radius: 4px; }
          .high-contrast { --builder-bg: #000; --builder-text: #fff; }
          .high-contrast .builder-element.selected { outline: 3px solid #ff0 !important; }
          .high-contrast input, .high-contrast select, .high-contrast textarea { border-color: #fff !important; background: #000 !important; color: #fff !important; }
          .theme-light { --builder-bg: #f8fafc; --builder-text: #0f172a; --builder-border: rgba(0,0,0,0.1); }
          .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
          .sr-only:focus { position: fixed; width: auto; height: auto; padding: 8px 16px; margin: 8px; overflow: visible; clip: auto; white-space: normal; border-width: 2px; z-index: 999; background: #7c3aed; color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600; }
        `}</style>
        <SovereignOSProvider>
          <BuilderContent />
        </SovereignOSProvider>
      </div>
    </Suspense>
  );
}
