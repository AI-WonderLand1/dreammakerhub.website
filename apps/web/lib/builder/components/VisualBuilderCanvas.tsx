'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Copy, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';
import { renderElement as renderElementCtx } from '../renderers';
import type { RendererCtx } from '../renderers/types';
import { CANVAS_ROOT_ID, acceptsChildren } from '../dnd-utils';

function buildElementCtx(
  el: CanvasElement,
  selectedId: string | null,
  selectElement: (id: string | null) => void,
): RendererCtx {
  const isSelected = selectedId === el.id;
  const style: React.CSSProperties = {
    ...(el.styles as React.CSSProperties),
    position: 'relative',
    cursor: 'pointer',
    outline: isSelected ? '1.5px solid #8b5cf6' : '1px solid transparent',
    outlineOffset: isSelected ? '2px' : '0',
  };

  if (!el.children?.length && acceptsChildren(el.type)) {
    style.minHeight = el.styles?.minHeight || '56px';
    style.minWidth = el.styles?.minWidth || '56px';
  }

  const baseProps = {
    key: el.id,
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      selectElement(el.id);
    },
    onFocus: () => selectElement(el.id),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation();
        selectElement(el.id);
      }
    },
    tabIndex: 0,
    role: 'group',
    'aria-label': `${el.name} element${el.props?.alt ? `: ${el.props.alt}` : ''}${
      el.props?.content && typeof el.props.content === 'string' ? `: ${el.props.content.slice(0, 50)}` : ''
    }`,
    style,
    className: `builder-element ${isSelected ? 'selected' : ''}`,
  };

  return {
    el,
    selectedId,
    selectElement,
    baseProps,
    style,
    children: el.children?.length ? (
      <SortableContext items={el.children.map((child) => child.id)} strategy={verticalListSortingStrategy}>
        {el.children.map((child) => (
          <SortableBlock
            key={child.id}
            el={child}
            parentId={el.id}
            selectedId={selectedId}
            selectElement={selectElement}
          />
        ))}
      </SortableContext>
    ) : undefined,
  };
}

function renderElement(
  el: CanvasElement,
  selectedId: string | null,
  selectElement: (id: string | null) => void,
): React.ReactNode {
  return renderElementCtx(buildElementCtx(el, selectedId, selectElement));
}

function SortableBlock({
  el,
  parentId,
  selectedId,
  selectElement,
}: {
  el: CanvasElement;
  parentId: string | null;
  selectedId: string | null;
  selectElement: (id: string | null) => void;
}) {
  const isSelected = selectedId === el.id;
  const setRightPanelOpen = useBuilderStore((state) => state.setRightPanelOpen);
  const setRightPanelTab = useBuilderStore((state) => state.setRightPanelTab);
  const removeElement = useBuilderStore((state) => state.removeElement);
  const duplicateElement = useBuilderStore((state) => state.duplicateElement);
  const updateElementStyles = useBuilderStore((state) => state.updateElementStyles);
  const zoom = useBuilderStore((state) => state.zoom);
  const snapToGrid = useBuilderStore((state) => state.snapToGrid);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [guideX, setGuideX] = useState(false);
  const [guideY, setGuideY] = useState(false);
  const [sizeLabel, setSizeLabel] = useState('');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: el.id,
    data: { type: 'canvas', parentId },
  });

  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      blockRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    position: 'relative',
    zIndex: isDragging ? 100 : isSelected ? 30 : undefined,
  };

  const openPanel = (tab: 'content' | 'ai') => {
    setRightPanelOpen(true);
    setRightPanelTab(tab);
  };

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const node = blockRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const parentRect = node.parentElement?.getBoundingClientRect() || null;
    const scale = Math.max(zoom, 0.1);
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = rect.width / scale;
    const startHeight = rect.height / scale;
    const alignmentThreshold = 6;
    setIsResizing(true);

    const onMove = (moveEvent: PointerEvent) => {
      let width = Math.max(24, startWidth + (moveEvent.clientX - startX) / scale);
      let height = Math.max(24, startHeight + (moveEvent.clientY - startY) / scale);
      let alignedX = false;
      let alignedY = false;

      if (snapToGrid) {
        width = Math.max(24, Math.round(width / 8) * 8);
        height = Math.max(24, Math.round(height / 8) * 8);

        if (parentRect) {
          const parentWidth = parentRect.width / scale;
          const parentHeight = parentRect.height / scale;
          const left = (rect.left - parentRect.left) / scale;
          const top = (rect.top - parentRect.top) / scale;
          const widthTargets = [parentWidth / 2 - left, parentWidth - left].filter((value) => value >= 24);
          const heightTargets = [parentHeight / 2 - top, parentHeight - top].filter((value) => value >= 24);

          const widthMatch = widthTargets.find((target) => Math.abs(width - target) <= alignmentThreshold);
          if (widthMatch != null) {
            width = widthMatch;
            alignedX = true;
          }

          const heightMatch = heightTargets.find((target) => Math.abs(height - target) <= alignmentThreshold);
          if (heightMatch != null) {
            height = heightMatch;
            alignedY = true;
          }
        }
      }

      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);
      setGuideX(alignedX);
      setGuideY(alignedY);
      setSizeLabel(`${roundedWidth} × ${roundedHeight}`);
      updateElementStyles(el.id, {
        width: `${roundedWidth}px`,
        height: `${roundedHeight}px`,
      });
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanup);
      window.removeEventListener('pointercancel', cleanup);
      setIsResizing(false);
      setGuideX(false);
      setGuideY(false);
      setSizeLabel('');
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cleanup, { once: true });
    window.addEventListener('pointercancel', cleanup, { once: true });
  };

  return (
    <div ref={setCombinedRef} style={style} {...attributes} {...listeners}>
      {guideX && (
        <div className="pointer-events-none absolute -right-px top-[-1000px] z-[70] h-[2000px] w-px bg-cyan-300/85 shadow-[0_0_8px_rgba(103,232,249,.65)]" aria-hidden="true" />
      )}
      {guideY && (
        <div className="pointer-events-none absolute -bottom-px left-[-1000px] z-[70] h-px w-[2000px] bg-cyan-300/85 shadow-[0_0_8px_rgba(103,232,249,.65)]" aria-hidden="true" />
      )}

      {isSelected && !isDragging && (
        <>
          <div
            className="absolute left-1/2 top-0 z-[80] flex -translate-x-1/2 -translate-y-[calc(100%+7px)] items-center gap-0.5 rounded-lg border border-violet-300/20 bg-[#0a1020]/95 p-1 shadow-[0_10px_30px_rgba(0,0,0,.42),0_0_22px_rgba(124,58,237,.14)] backdrop-blur-xl"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            aria-label={`${el.name} quick actions`}
          >
            <span className="max-w-28 truncate px-2 text-[8px] font-black uppercase tracking-[.1em] text-violet-100/60">
              {el.name}
            </span>
            <span className="h-4 w-px bg-white/8" />
            <button
              type="button"
              onClick={() => openPanel('content')}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/[.06] hover:text-white"
              title="Open Design inspector"
              aria-label="Open Design inspector"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => openPanel('ai')}
              className="flex h-7 items-center gap-1 rounded-md bg-violet-500/10 px-2 text-[8px] font-black text-violet-100/70 transition hover:bg-violet-500/20 hover:text-white"
              title="Edit selected element with AI"
              aria-label="Edit selected element with AI"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI
            </button>
            <button
              type="button"
              onClick={() => duplicateElement(el.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/[.06] hover:text-white"
              title="Duplicate element"
              aria-label={`Duplicate ${el.name}`}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => removeElement(el.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
              title="Delete element"
              aria-label={`Delete ${el.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {isResizing && sizeLabel && (
            <div className="pointer-events-none absolute bottom-5 right-0 z-[86] rounded-md border border-cyan-300/20 bg-[#07101d]/95 px-2 py-1 font-mono text-[8px] font-bold text-cyan-100 shadow-lg" aria-live="polite">
              {sizeLabel}{snapToGrid ? ' · snap 8px' : ''}
            </div>
          )}

          <button
            type="button"
            onPointerDown={beginResize}
            className="absolute -bottom-1.5 -right-1.5 z-[85] h-3.5 w-3.5 cursor-nwse-resize rounded-[3px] border border-violet-200/80 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,.6)]"
            title={snapToGrid ? 'Resize element · snaps to 8px grid and alignment guides' : 'Resize element'}
            aria-label={`Resize ${el.name}`}
          />
        </>
      )}
      {renderElement(el, selectedId, selectElement)}
    </div>
  );
}

const BREAKPOINT_WIDTHS: Record<string, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1180px',
  wide: '1366px',
};

export default function VisualBuilderCanvas() {
  const {
    elements,
    selectedId,
    selectElement,
    zoom,
    pan,
    setPan,
    setZoom,
    showGrid,
    activeBreakpoint,
    theme,
  } = useBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const { setNodeRef: setCanvasDroppableRef, isOver: isCanvasOver } = useDroppable({ id: CANVAS_ROOT_ID });

  const handleCanvasClick = useCallback(() => selectElement(null), [selectElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.05 : 0.05;
      setZoom(zoom + delta);
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [zoom, setZoom]);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 1) return;
    event.preventDefault();
    setIsPanning(true);
    setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      canvasRef.current = node;
      setCanvasDroppableRef(node);
    },
    [setCanvasDroppableRef],
  );

  const stageWidth = BREAKPOINT_WIDTHS[activeBreakpoint] || BREAKPOINT_WIDTHS.desktop;
  const stageBackground = theme?.colors?.background || '#0f172a';
  const stageText = theme?.colors?.text || '#f8fafc';

  return (
    <div
      ref={mergedRef}
      className="wb-canvas-workspace relative h-full w-full select-none overflow-auto bg-[#050914] text-white"
      style={{
        backgroundImage: showGrid
          ? 'linear-gradient(rgba(124,58,237,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.045) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '24px 24px',
        cursor: isPanning ? 'grabbing' : isCanvasOver ? 'copy' : 'default',
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="min-h-full min-w-full px-8 py-7">
        <div
          className="flex min-h-full justify-center transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          <div
            className={`wb-canvas-stage relative min-h-[820px] shrink-0 overflow-visible border border-violet-300/15 shadow-[0_24px_90px_rgba(0,0,0,.48),0_0_0_1px_rgba(124,58,237,.07)] transition-[width,border-radius] duration-200 ${
              activeBreakpoint === 'mobile'
                ? 'rounded-[28px]'
                : activeBreakpoint === 'tablet'
                  ? 'rounded-xl'
                  : 'rounded-sm'
            }`}
            style={{
              width: stageWidth,
              maxWidth: 'calc(100vw - 120px)',
              backgroundColor: stageBackground,
              color: stageText,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-violet-300/65 to-transparent" />

            {elements.length === 0 ? (
              <div className="flex min-h-[820px] items-center justify-center overflow-hidden p-8">
                <div className="max-w-sm rounded-2xl border border-dashed border-violet-300/20 bg-black/10 p-8 text-center backdrop-blur-sm">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10 text-xl">✦</div>
                  <h3 className="text-sm font-bold text-violet-100">Start building this page</h3>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/35">Drag a block from Insert onto the page, or ask AI Assist to create one. Both use this same live page state.</p>
                  <p className="mt-3 text-[9px] text-white/20">Ctrl/⌘ + wheel to zoom · middle mouse to pan</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <SortableContext items={elements.map((element) => element.id)} strategy={verticalListSortingStrategy}>
                  {elements.map((element) => (
                    <SortableBlock
                      key={element.id}
                      el={element}
                      parentId={null}
                      selectedId={selectedId}
                      selectElement={selectElement}
                    />
                  ))}
                </SortableContext>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
