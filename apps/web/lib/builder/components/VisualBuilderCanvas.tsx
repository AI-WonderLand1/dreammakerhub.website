'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useBuilderStore } from '../store';
import { CanvasElement, BlockDefinition } from '../types';
import { findBlockDefinition } from '../blocks/utils';
import { renderElement as renderElementCtx } from '../renderers';
import type { RendererCtx } from '../renderers/types';

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
    children: el.children?.map((child) =>
      renderElementCtx(buildElementCtx(child, selectedId, selectElement))
    ),
  };
}

function renderElement(el: CanvasElement, selectedId: string | null, selectElement: (id: string | null) => void): React.ReactNode {
  return renderElementCtx(buildElementCtx(el, selectedId, selectElement));
}

const BREAKPOINT_WIDTHS: Record<string, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
  wide: '100%',
};

const CONTAINER_TYPES = ['group', 'columns', 'row', 'grid', 'flex', 'section', 'container', 'card'];

function findDropContainer(elements: CanvasElement[], x: number, y: number): { parentId?: string; element?: CanvasElement } {
  for (const el of elements) {
    if (CONTAINER_TYPES.includes(el.type) && el.children) {
      return { parentId: el.id, element: el };
    }
  }
  for (const el of elements) {
    if (el.children && el.children.length > 0) {
      const nested = findDropContainer(el.children, x, y);
      if (nested.parentId) return nested;
    }
  }
  return {};
}

export default function VisualBuilderCanvas() {
  const { elements, selectedId, selectElement, zoom, pan, setPan, setZoom, addElement, showGrid, snapToGrid, activeBreakpoint } = useBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragCounter = useRef(0);

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

  // Drag over (for drops from ComponentLibrary)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      setDragPos({ x: canvasX, y: canvasY });
      // Find nearest container for nesting
      if (elements.length > 0) {
        const container = findDropContainer(elements, canvasX, canvasY);
        setDropTarget(container.parentId || null);
      }
    }
  }, [pan, zoom, elements]);

  const handleDragLeave = useCallback(() => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
      setDropTarget(null);
    }
  }, []);

  const handleDragEnter = useCallback(() => {
    dragCounter.current += 1;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setDropTarget(null);
    dragCounter.current = 0;
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as BlockDefinition;
      // Allowlist enforcement: if the drop target is a container with an
      // `allowedChildren` array, reject blocks whose type isn't permitted.
      if (dropTarget) {
        const containerType = elements.find((el) => el.id === dropTarget)?.type;
        const containerDef = containerType ? findBlockDefinition(containerType) : null;
        if (containerDef?.allowedChildren && !containerDef.allowedChildren.includes(data.type)) {
          return;
        }
      }
      const el: CanvasElement = {
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: data.type,
        name: data.name,
        icon: data.icon,
        props: { ...data.defaultProps },
        styles: { ...data.defaultStyles },
      };
      addElement(el, dropTarget || undefined);
    } catch { /* ignore */ }
  }, [addElement, dropTarget]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-[#090d16] text-white select-none"
      style={{
        backgroundImage: showGrid
          ? 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '24px 24px',
        cursor: isPanning ? 'grabbing' : dragging ? 'copy' : 'default',
      }}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Drop indicator */}
      {dragging && (
        <>
          {dropTarget && (
            <div
              className="absolute z-20 pointer-events-none border-2 border-dashed border-purple-500/50 rounded-lg"
              style={{
                left: pan.x,
                top: pan.y,
                width: '200px',
                height: '60px',
                transform: `scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              <span className="absolute -top-4 left-2 bg-purple-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                Drop into container
              </span>
            </div>
          )}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: dragPos.x * zoom + pan.x,
              top: dragPos.y * zoom + pan.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-purple-900/50">
              {dropTarget ? '+ Nest' : '+ Drop here'}
            </div>
          </div>
        </>
      )}

      {/* Transformed canvas */}
      <div
        className="absolute inset-0 transition-transform duration-75 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {elements.length === 0 && !dragging ? (
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
              {elements.map((el) => renderElement(el, selectedId, selectElement))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
