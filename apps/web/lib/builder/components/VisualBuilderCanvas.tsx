'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore } from '../store';
import { CanvasElement } from '../types';
import { renderElement as renderElementCtx } from '../renderers';
import type { RendererCtx } from '../renderers/types';
import { CANVAS_ROOT_ID } from '../dnd-utils';

function buildElementCtx(el: CanvasElement, selectedId: string | null, selectElement: (id: string | null) => void): RendererCtx {
  const isSelected = selectedId === el.id;
  const style: React.CSSProperties = {
    ...el.styles,
    position: 'relative',
    cursor: 'pointer',
    outline: isSelected ? '2px solid #7c3aed' : '1px solid transparent',
    outlineOffset: '2px',
  };

  const baseProps = {
    key: el.id,
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); selectElement(el.id); },
    onFocus: () => selectElement(el.id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
        selectElement(el.id);
      }
    },
    tabIndex: 0,
    role: 'group',
    'aria-label': `${el.name} element${el.props?.alt ? `: ${el.props.alt}` : ''}${el.props?.content ? `: ${typeof el.props.content === 'string' ? el.props.content.slice(0, 50) : ''}` : ''}`,
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
      <SortableContext items={el.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {el.children.map((child) => (
          <SortableBlock key={child.id} el={child} parentId={el.id} selectedId={selectedId} selectElement={selectElement} />
        ))}
      </SortableContext>
    ) : undefined,
  };
}

function renderElement(el: CanvasElement, selectedId: string | null, selectElement: (id: string | null) => void): React.ReactNode {
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: el.id,
    data: { type: 'canvas', parentId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderElement(el, selectedId, selectElement)}
    </div>
  );
}

const BREAKPOINT_WIDTHS: Record<string, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
  wide: '100%',
};

export default function VisualBuilderCanvas() {
  const { elements, selectedId, selectElement, zoom, pan, setPan, setZoom, showGrid, activeBreakpoint } = useBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const { setNodeRef: setCanvasDroppableRef, isOver: isCanvasOver } = useDroppable({ id: CANVAS_ROOT_ID });

  const handleCanvasClick = useCallback(() => selectElement(null), [selectElement]);

  // Mouse wheel zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setZoom(zoom + delta);
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoom, setZoom]);

  // Pan with middle mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };
  const handleMouseUp = () => setIsPanning(false);

  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      canvasRef.current = node;
      setCanvasDroppableRef(node);
    },
    [setCanvasDroppableRef]
  );

  return (
    <div
      ref={mergedRef}
      className="relative w-full h-full overflow-hidden bg-[#090d16] text-white select-none"
      style={{
        backgroundImage: showGrid
          ? 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '24px 24px',
        cursor: isPanning ? 'grabbing' : isCanvasOver ? 'copy' : 'default',
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Transformed canvas */}
      <div
        className="absolute inset-0 transition-transform duration-75 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {elements.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center p-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] backdrop-blur-sm max-w-sm">
              <p className="text-4xl mb-3">🎨</p>
              <h3 className="text-lg font-semibold text-purple-300">Infinite Canvas</h3>
              <p className="text-sm text-white/40 mt-1">Drag blocks from the library or click to add them.</p>
              <p className="text-[10px] text-white/20 mt-2">Scroll to zoom · Middle-click to pan</p>
            </div>
          </div>
        ) : (
          <div className="p-8 min-h-full min-w-full" style={{ width: '4000px', height: '4000px' }}>
            <div
              className="mx-auto transition-all duration-200"
              style={{
                maxWidth: BREAKPOINT_WIDTHS[activeBreakpoint] || '100%',
                width: activeBreakpoint === 'mobile' || activeBreakpoint === 'tablet' ? BREAKPOINT_WIDTHS[activeBreakpoint] : '100%',
                boxShadow: activeBreakpoint === 'mobile' || activeBreakpoint === 'tablet' ? '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4)' : 'none',
                borderRadius: activeBreakpoint === 'mobile' ? '24px' : activeBreakpoint === 'tablet' ? '12px' : '0',
                backgroundColor: 'var(--builder-bg, transparent)',
                padding: activeBreakpoint === 'mobile' || activeBreakpoint === 'tablet' ? '16px' : '0',
              }}
            >
              <SortableContext items={elements.map((el) => el.id)} strategy={verticalListSortingStrategy}>
                {elements.map((el) => (
                  <SortableBlock key={el.id} el={el} parentId={null} selectedId={selectedId} selectElement={selectElement} />
                ))}
              </SortableContext>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
