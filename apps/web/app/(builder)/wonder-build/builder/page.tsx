'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSovereignOS } from '../context/SovereignOSContext';
import { SovereignOSProvider } from '../context/SovereignOSContext';
import { SovereignNavBar } from '../components/SovereignNavBar';
import { CloudSandboxPanel } from '../components/CloudSandboxPanel';
import { useBuilderStore } from '@/lib/builder/store';
import type { CanvasElement } from '@/lib/builder/types';
import { parseHtmlToElements, isHtmlString } from '@/lib/builder/html-parser';
import { getPipeline } from '@/lib/builder/pipeline/PipelineManager';
import { storageService } from '@/lib/builder/pipeline/StorageService';
import { livePreviewService } from '@/lib/builder/pipeline/LivePreviewService';
import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';

const VisualBuilderCanvas = dynamic(() => import('@/lib/builder/components/VisualBuilderCanvas'), { ssr: false });
const ComponentLibrary = dynamic(() => import('@/lib/builder/components/ComponentLibrary'), { ssr: false });
const InspectorPanel = dynamic(() => import('@/lib/builder/components/InspectorPanel'), { ssr: false });
const AIAssistantPanel = dynamic(() => import('@/lib/builder/components/AIAssistantPanel'), { ssr: false });
const ImportExportPanel = dynamic(() => import('@/lib/builder/components/ImportExportPanel'), { ssr: false });
const LayersPanel = dynamic(() => import('@/lib/builder/components/LayersPanel'), { ssr: false });
const AccessibilityBar = dynamic(() => import('@/lib/builder/components/AccessibilityBar'), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import('@/lib/builder/components/KeyboardShortcutsModal'), { ssr: false });
const AccessibilityCheckerPanel = dynamic(() => import('@/lib/builder/components/AccessibilityCheckerPanel'), { ssr: false });
const TemplatesPanel = dynamic(() => import('@/lib/builder/components/TemplatesPanel'), { ssr: false });
const PipelineIndicator = dynamic(() => import('@/lib/builder/components/PipelineIndicator'), { ssr: false });
const FileManagerPanel = dynamic(() => import('@/components/file-manager/FileManagerPanel'), { ssr: false });

type BuilderTab = 'code' | 'design' | 'preview';

function BuilderContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const { editorCode, setEditorCode } = useSovereignOS();

  const store = useBuilderStore();
  const {
    setElements, leftPanelOpen, setLeftPanelOpen, leftPanelTab, setLeftPanelTab,
    rightPanelOpen, setRightPanelOpen, rightPanelTab, setRightPanelTab, showGrid, setShowGrid, snapToGrid, setSnapToGrid,
    undo, redo, zoom, setZoom, selectedId, elements, removeElement, selectElement,
    setShortcutsModalOpen, shortcutsModalOpen, setProjectId,
  } = store;

  const [tab, setTab] = useState<BuilderTab>('design');
  const [imported, setImported] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Initialize pipeline with project ID
  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
      storageService.setProjectId(projectId);
    }
    const pipe = getPipeline({ projectId: projectId || undefined });
    if (!pipe.isRunning()) {
      pipe.start();
    }
    return () => {};
  }, [projectId, setProjectId]);

  // Wire preview iframe
  useEffect(() => {
    if (previewRef.current) {
      livePreviewService.setIframe(previewRef.current);
    }
  }, [tab]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    const pendingCode = sessionStorage.getItem('pendingBuilderCode');
    if (pendingCode) {
      setEditorCode(pendingCode);
      sessionStorage.removeItem('pendingBuilderCode');
      setImported(true);
    }
  }, [setEditorCode]);

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
          case 's':
            e.preventDefault();
            if (projectId) {
              storageService.saveToProject();
            }
            showToast('✅ Saved');
            break;
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
          case 'Delete': case 'Backspace':
            if (selectedId) { e.preventDefault(); removeElement(selectedId); }
            break;
          case 'Escape':
            if (shortcutsModalOpen) setShortcutsModalOpen(false);
            else if (selectedId) selectElement(null);
            break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, elements, undo, redo, removeElement, selectElement, zoom, setZoom, shortcutsModalOpen, setShortcutsModalOpen, showToast, projectId]);

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
      <a
        href="#builder-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-purple-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-xs focus:font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        Skip to canvas content
      </a>

      <header role="banner" className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <a href="/wonder-build" className="text-xs text-white/40 hover:text-white transition-colors">← Hub</a>
          <span className="text-white/20">/</span>
          <span className="text-xs font-semibold text-white/80">Builder</span>
          {projectId && (
            <span className="text-[9px] font-mono text-white/20 ml-2">ID: {projectId.slice(0, 8)}</span>
          )}
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
                  <button
                    onClick={() => {
                      if (confirm('Clear all elements? This cannot be undone.')) {
                        useBuilderStore.getState().setElements([]);
                        showToast('🗑️ Canvas cleared');
                      }
                    }}
                    className="px-1.5 py-1 rounded text-[10px] text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Clear canvas"
                    aria-label="Clear all elements"
                  >
                    🗑️
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
                  <span className="text-white/20 mx-1" aria-hidden="true">|</span>
                  <PipelineIndicator />
                </div>
              </nav>

              <div className="flex flex-1 overflow-hidden relative">
                {leftPanelOpen && (
                  <aside aria-label="Block library and layers" className="shrink-0 border-r border-white/10">
                    <nav aria-label="Panel tabs" className="flex border-b border-white/10">
                      {(['blocks', 'layers', 'templates', 'files'] as const).map((tabName) => (
                        <button
                          key={tabName}
                          onClick={() => setLeftPanelTab(tabName)}
                          role="tab"
                          aria-selected={leftPanelTab === tabName}
                          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                            leftPanelTab === tabName ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {tabName === 'blocks' ? '🧱 Blocks' : tabName === 'layers' ? '📋 Layers' : tabName === 'templates' ? '📄 Templates' : '📁 Files'}
                        </button>
                      ))}
                    </nav>
                    <div role="tabpanel">
                      {leftPanelTab === 'blocks' && <ComponentLibrary />}
                      {leftPanelTab === 'layers' && <LayersPanel />}
                      {leftPanelTab === 'templates' && <TemplatesPanel />}
                      {leftPanelTab === 'files' && <FileManagerPanel projectId={projectId} />}
                    </div>
                  </aside>
                )}

                <div id="builder-canvas" className="flex-1 overflow-hidden relative" role="main" aria-label="Design canvas">
                  <VisualBuilderCanvas />
                </div>

                {rightPanelOpen && (
                  <aside aria-label="Element inspector" className="shrink-0 w-80 border-l border-white/10 flex flex-col">
                    <nav aria-label="Right panel tabs" className="flex border-b border-white/10 bg-[#0c101d]">
                      {(['content', 'ai', 'import-export'] as const).map((tabName) => (
                        <button
                          key={tabName}
                          onClick={() => setRightPanelTab(tabName)}
                          role="tab"
                          aria-selected={rightPanelTab === tabName}
                          className={`flex-1 px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                            rightPanelTab === tabName ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {tabName === 'content' ? '🔧 Inspector' : tabName === 'ai' ? '🤖 AI' : '📦 Import/Export'}
                        </button>
                      ))}
                    </nav>
                    <div className="flex-1 overflow-hidden">
                      {rightPanelTab === 'content' && <InspectorPanel />}
                      {rightPanelTab === 'ai' && <AIAssistantPanel />}
                      {rightPanelTab === 'import-export' && <ImportExportPanel />}
                    </div>
                  </aside>
                )}
              </div>
            </div>
          )}

          {tab === 'preview' && (
            <div role="tabpanel" aria-label="Preview" className="h-full flex flex-col">
              <div className="shrink-0 flex items-center gap-2 border-b border-white/10 bg-[#0b0f19] px-3 py-1.5">
                <span className="text-[10px] font-semibold text-white/50">LIVE PREVIEW</span>
                <span className="text-[9px] text-white/20">auto-refreshes on validation pass</span>
                <button
                  onClick={() => livePreviewService.setIframe(previewRef.current)}
                  className="ml-auto px-2 py-0.5 rounded text-[9px] bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="flex-1 bg-white">
                <iframe
                  ref={previewRef}
                  className="w-full h-full border-0"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <KeyboardShortcutsModal />

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-lg bg-purple-600/90 text-white px-4 py-2 text-xs font-semibold shadow-xl shadow-purple-900/30 backdrop-blur-sm transition-all duration-300"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
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
