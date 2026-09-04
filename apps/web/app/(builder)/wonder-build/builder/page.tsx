'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import dynamic from 'next/dynamic';
import { SovereignOSProvider, useSovereignOS } from '../context/SovereignOSContext';
import { SovereignNavBar } from '../components/SovereignNavBar';
import type { BuilderMode } from '../components/SovereignNavBar';
import { CloudSandboxPanel } from '../components/CloudSandboxPanel';
import { useBuilderStore } from '@/lib/builder/store';
import type { BlockDefinition, LeftPanelTab } from '@/lib/builder/types';
import { findBlockDefinition } from '@/lib/builder/blocks/utils';
import { getPipeline } from '@/lib/builder/pipeline/PipelineManager';
import { storageService } from '@/lib/builder/pipeline/StorageService';
import { livePreviewService } from '@/lib/builder/pipeline/LivePreviewService';
import {
  CANVAS_ROOT_ID,
  acceptsChildren,
  blockToCanvasElement,
  findElementInfo,
  isDescendantOf,
} from '@/lib/builder/dnd-utils';

const VisualBuilderCanvas = dynamic(() => import('@/lib/builder/components/VisualBuilderCanvas'), { ssr: false });
const PagesPanel = dynamic(() => import('@/lib/builder/components/PagesPanel'), { ssr: false });
const ComponentLibrary = dynamic(() => import('@/lib/builder/components/ComponentLibrary'), { ssr: false });
const CMSPanel = dynamic(() => import('@/lib/builder/components/CMSPanel'), { ssr: false });
const AssetsPanel = dynamic(() => import('@/lib/builder/components/AssetsPanel'), { ssr: false });
const SavedComponentsPanel = dynamic(() => import('@/lib/builder/components/SavedComponentsPanel'), { ssr: false });
const InspectorPanel = dynamic(() => import('@/lib/builder/components/InspectorPanel'), { ssr: false });
const InteractionPanel = dynamic(() => import('@/lib/builder/components/InteractionPanel'), { ssr: false });
const AIAssistantPanel = dynamic(() => import('@/lib/builder/components/AIAssistantPanel'), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import('@/lib/builder/components/KeyboardShortcutsModal'), { ssr: false });

const LEFT_TABS: Array<{ id: LeftPanelTab; label: string; short: string }> = [
  { id: 'pages', label: 'Pages', short: '📑' },
  { id: 'insert', label: 'Insert', short: '＋' },
  { id: 'cms', label: 'CMS', short: '◫' },
  { id: 'assets', label: 'Assets', short: '◇' },
  { id: 'components', label: 'Components', short: '⌑' },
];

function BuilderContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const { setEditorCode } = useSovereignOS();

  const {
    leftPanelOpen,
    leftPanelTab,
    setLeftPanelTab,
    rightPanelOpen,
    rightPanelTab,
    setRightPanelTab,
    undo,
    redo,
    zoom,
    setZoom,
    selectedId,
    removeElement,
    selectElement,
    duplicateElement,
    setShortcutsModalOpen,
    shortcutsModalOpen,
    setProjectId,
    addElement,
    moveElement,
  } = useBuilderStore();

  const [tab, setTab] = useState<BuilderMode>(() => {
    const requested = searchParams.get('tab');
    return requested === 'code' || requested === 'preview' ? requested : 'design';
  });
  const [toast, setToast] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');
  const [dragOverlay, setDragOverlay] = useState<BlockDefinition | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const switchTab = useCallback((next: BuilderMode) => {
    setTab(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }, []);

  useEffect(() => {
    const pendingCode = sessionStorage.getItem('pendingBuilderCode');
    if (!pendingCode) return;
    setEditorCode(pendingCode);
    sessionStorage.removeItem('pendingBuilderCode');
    switchTab('code');
    showToast('AI-generated code loaded');
  }, [setEditorCode, showToast, switchTab]);

  useEffect(() => {
    const rawTab = leftPanelTab as string;
    const legacyMap: Record<string, LeftPanelTab> = {
      blocks: 'insert',
      layers: 'pages',
      templates: 'insert',
      files: 'assets',
    };
    const normalized = legacyMap[rawTab];
    if (normalized) setLeftPanelTab(normalized);
  }, [leftPanelTab, setLeftPanelTab]);

  useEffect(() => {
    if (!['content', 'interactions', 'ai'].includes(rightPanelTab)) setRightPanelTab('content');
  }, [rightPanelTab, setRightPanelTab]);

  useEffect(() => {
    const pipeline = getPipeline({ projectId: projectId || undefined });
    if (!pipeline.isRunning()) pipeline.start();

    if (!projectId) {
      setProjectId('');
      setProjectStatus('ready');
      return;
    }

    setProjectId(projectId);
    storageService.setProjectId(projectId);

    let cancelled = false;
    fetch(`/api/projects/${projectId}`)
      .then((response) => {
        if (cancelled) return;
        setProjectStatus(response.status === 404 ? 'notfound' : 'ready');
      })
      .catch(() => {
        if (!cancelled) setProjectStatus('ready');
      });

    import('@/lib/supabase/client')
      .then(async ({ createClient, ensureSupabaseConfig }) => {
        const config = await ensureSupabaseConfig();
        if (!config) return;
        const client = createClient();
        if (!client) return;
        const { data } = await client.auth.getSession();
        const ownerId = data.session?.user?.id;
        if (ownerId) storageService.setOwnerId(ownerId);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [projectId, setProjectId]);

  useEffect(() => {
    if (tab === 'preview' && previewRef.current) {
      livePreviewService.setIframe(previewRef.current);
    }
  }, [tab]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (event.key === '?' && !isInput) {
        event.preventDefault();
        setShortcutsModalOpen(!shortcutsModalOpen);
        return;
      }
      if (isInput) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            undo();
            return;
          case 'y':
            event.preventDefault();
            redo();
            return;
          case 's':
            event.preventDefault();
            if (!projectId) {
              showToast('Saved locally');
              return;
            }
            void storageService.saveToProject();
            void storageService.saveRevision().then((revision) => {
              showToast(revision ? 'Saved + revision' : 'Saved');
            });
            return;
          case 'd':
            if (selectedId) {
              event.preventDefault();
              duplicateElement(selectedId);
            }
            return;
          case '0':
            event.preventDefault();
            setZoom(1);
            return;
          case '=':
          case '+':
            event.preventDefault();
            setZoom(Math.min(3, zoom + 0.1));
            return;
          case '-':
            event.preventDefault();
            setZoom(Math.max(0.1, zoom - 0.1));
            return;
        }
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedId) {
          event.preventDefault();
          removeElement(selectedId);
        }
        return;
      }

      if (event.key === 'Escape') {
        if (shortcutsModalOpen) setShortcutsModalOpen(false);
        else if (selectedId) selectElement(null);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    duplicateElement,
    projectId,
    redo,
    removeElement,
    selectElement,
    selectedId,
    setShortcutsModalOpen,
    setZoom,
    shortcutsModalOpen,
    showToast,
    undo,
    zoom,
  ]);

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const within = pointerWithin(args);
    if (within.length > 0) {
      const inner = within.filter((collision) => collision.id !== CANVAS_ROOT_ID);
      return inner.length > 0 ? inner : within;
    }
    return closestCenter(args);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as { type?: string; block?: BlockDefinition } | undefined;
    if (data?.type === 'palette' && data.block) setDragOverlay(data.block);
  }, []);

  const handleDragCancel = useCallback(() => setDragOverlay(null), []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDragOverlay(null);
      if (!over) return;

      const currentElements = useBuilderStore.getState().elements;
      const allowedIn = (containerType: string, childType: string): boolean => {
        const containerDefinition = findBlockDefinition(containerType);
        return !containerDefinition?.allowedChildren || containerDefinition.allowedChildren.includes(childType);
      };

      const activeData = active.data.current as
        | { type?: string; parentId?: string | null; block?: BlockDefinition }
        | undefined;
      const overId = String(over.id);

      if (activeData?.type === 'palette' && activeData.block) {
        const element = blockToCanvasElement(activeData.block);
        if (overId === CANVAS_ROOT_ID) {
          addElement(element);
          return;
        }

        const overInfo = findElementInfo(currentElements, overId);
        if (!overInfo) {
          addElement(element);
          return;
        }

        if (acceptsChildren(overInfo.el.type)) {
          if (allowedIn(overInfo.el.type, element.type)) addElement(element, overInfo.el.id);
          else addElement(element);
          return;
        }

        if (overInfo.parentId) {
          const parentInfo = findElementInfo(currentElements, overInfo.parentId);
          if (parentInfo && allowedIn(parentInfo.el.type, element.type)) {
            addElement(element, parentInfo.el.id);
            return;
          }
        }

        addElement(element);
        return;
      }

      const activeId = String(active.id);
      if (overId === activeId) return;
      const activeInfo = findElementInfo(currentElements, activeId);
      if (!activeInfo) return;
      if (activeInfo.el.children?.length && isDescendantOf(currentElements, overId, activeId)) return;

      let targetParentId: string | null = null;
      let targetIndex = currentElements.length;

      if (overId !== CANVAS_ROOT_ID) {
        const overInfo = findElementInfo(currentElements, overId);
        if (!overInfo) return;

        if (acceptsChildren(overInfo.el.type)) {
          if (!allowedIn(overInfo.el.type, activeInfo.el.type)) return;
          targetParentId = overInfo.el.id;
          targetIndex = overInfo.el.children?.length ?? 0;
        } else {
          targetParentId = overInfo.parentId;
          targetIndex = overInfo.index;
          if (targetParentId) {
            const parentInfo = findElementInfo(currentElements, targetParentId);
            if (parentInfo && !allowedIn(parentInfo.el.type, activeInfo.el.type)) return;
          }
        }
      }

      moveElement(activeId, targetParentId, targetIndex);
    },
    [addElement, moveElement],
  );

  if (projectStatus === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-[#050816] text-xs text-white/45">
        Opening WonderBuild…
      </div>
    );
  }

  if (projectStatus === 'notfound') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#050816] p-8 text-center">
        <div className="text-4xl">🔍</div>
        <h1 className="text-xl font-bold text-white">Project not found</h1>
        <p className="max-w-sm text-xs text-white/50">This website project does not exist or you do not have access to it.</p>
        <a href="/dashboard/projects" className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500">
          Back to Projects
        </a>
      </div>
    );
  }

  const normalizedRightTab = rightPanelTab === 'interactions' || rightPanelTab === 'ai' ? rightPanelTab : 'content';

  return (
    <div className="h-full overflow-hidden bg-[#050816] text-white">
      <a
        href="#builder-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to canvas
      </a>

      <SovereignNavBar activeMode={tab} onModeChange={switchTab} />

      <div className="h-full pt-[52px]">
        {tab === 'code' && (
          <div className="h-full" role="tabpanel" aria-label="Code editor">
            <CloudSandboxPanel />
          </div>
        )}

        {tab === 'design' && (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex h-full overflow-hidden" role="tabpanel" aria-label="Build editor">
              {leftPanelOpen && (
                <aside aria-label="Pages, Insert, CMS, Assets, and Components" className="shrink-0 border-r border-white/10">
                  <nav aria-label="Panel tabs" className="flex border-b border-white/10">
                    {LEFT_TABS.map((panel) => (
                      <button
                        key={panel.id}
                        type="button"
                        onClick={() => setLeftPanelTab(panel.id)}
                        role="tab"
                        aria-selected={leftPanelTab === panel.id}
                        className={`flex-1 px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                          leftPanelTab === panel.id
                            ? 'bg-violet-600/20 text-violet-300 border-b-2 border-violet-500'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                        title={panel.label}
                      >
                        {panel.short} {panel.label}
                      </button>
                    ))}
                  </nav>
                  <div role="tabpanel" className="h-full min-h-0">
                    {leftPanelTab === 'pages' && <PagesPanel />}
                    {leftPanelTab === 'insert' && <ComponentLibrary />}
                    {leftPanelTab === 'cms' && <CMSPanel projectId={projectId} />}
                    {leftPanelTab === 'assets' && <AssetsPanel projectId={projectId} />}
                    {leftPanelTab === 'components' && <SavedComponentsPanel projectId={projectId} />}
                  </div>
                </aside>
              )}

              <main id="builder-canvas" className="relative min-w-0 flex-1 overflow-hidden" aria-label="Design canvas">
                <VisualBuilderCanvas />
              </main>

              {rightPanelOpen && (
                <aside aria-label="Element inspector" className="flex shrink-0 flex-col border-l border-white/10">
                  <nav aria-label="Right panel tabs" className="flex border-b border-white/10 bg-[#080c18]">
                    {([
                      ['content', 'Design'],
                      ['interactions', 'Interact'],
                      ['ai', 'AI Assist'],
                    ] as const).map(([tabName, label]) => (
                      <button
                        key={tabName}
                        type="button"
                        onClick={() => setRightPanelTab(tabName)}
                        role="tab"
                        aria-selected={normalizedRightTab === tabName}
                        className={`flex-1 px-2 py-2 text-[10px] font-semibold transition-colors ${
                          normalizedRightTab === tabName
                            ? 'bg-violet-600/18 text-violet-200 border-b-2 border-violet-500'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>
                  <div className="min-h-0 flex-1 overflow-hidden" role="tabpanel">
                    {normalizedRightTab === 'content' && <InspectorPanel />}
                    {normalizedRightTab === 'interactions' && <InteractionPanel />}
                    {normalizedRightTab === 'ai' && <AIAssistantPanel />}
                  </div>
                </aside>
              )}
            </div>

            <DragOverlay dropAnimation={null}>
              {dragOverlay ? (
                <div className="pointer-events-none flex items-center gap-2 rounded-lg border border-violet-500/50 bg-[#11162a] px-3 py-2 text-xs text-white shadow-xl shadow-violet-950/40">
                  <span className="text-lg">{dragOverlay.icon}</span>
                  <span className="font-semibold">{dragOverlay.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {tab === 'preview' && (
          <div className="flex h-full flex-col" role="tabpanel" aria-label="Live preview">
            <div className="flex h-8 shrink-0 items-center border-b border-white/10 bg-[#070b16] px-3 text-[9px] font-semibold text-white/35">
              LIVE PREVIEW
              <button
                type="button"
                onClick={() => livePreviewService.setIframe(previewRef.current)}
                className="ml-auto rounded-md border border-white/8 bg-white/[.03] px-2 py-1 text-white/45 hover:text-white"
              >
                Refresh
              </button>
            </div>
            <iframe
              ref={previewRef}
              className="min-h-0 flex-1 border-0 bg-white"
              title="WonderBuild live preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      <KeyboardShortcutsModal />

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-lg bg-violet-600/95 px-4 py-2 text-xs font-semibold text-white shadow-xl shadow-violet-950/30"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#050816] text-white">Loading WonderBuild…</div>}>
      <div className="h-screen overflow-hidden bg-[#050816] text-white">
        <style>{`
          *:focus-visible { outline: 2px solid #7c3aed !important; outline-offset: 2px !important; border-radius: 4px; }
          .high-contrast { --builder-bg: #000; --builder-text: #fff; }
          .high-contrast .builder-element.selected { outline: 3px solid #ff0 !important; }
          .high-contrast input, .high-contrast select, .high-contrast textarea { border-color: #fff !important; background: #000 !important; color: #fff !important; }
          .theme-light { --builder-bg: #f8fafc; --builder-text: #0f172a; --builder-border: rgba(0,0,0,0.1); }
          .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
        `}</style>
        <SovereignOSProvider>
          <BuilderContent />
        </SovereignOSProvider>
      </div>
    </Suspense>
  );
}
