'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useBuilderStore } from '../store';
import { CanvasElement, BlockDefinition } from '../types';

function renderElement(el: CanvasElement, selectedId: string | null, selectElement: (id: string | null) => void): React.ReactNode {
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
    style,
    className: `builder-element ${isSelected ? 'selected' : ''}`,
  };

  const children = el.children?.map((child) =>
    renderElement(child, selectedId, selectElement)
  );

  switch (el.type) {
    case 'heading':
      const Tag = (el.props.level || 'h2') as keyof JSX.IntrinsicElements;
      return <Tag {...baseProps}>{el.props.content || 'Heading'}{children}</Tag>;
    case 'paragraph':
      return <p {...baseProps}>{el.props.content}{children}</p>;
    case 'rich-text':
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: el.props.content || '' }} />;
    case 'list': {
      const ListTag = el.props.listType === 'ordered' ? 'ol' : 'ul';
      const items = (el.props.items as string[]) || [];
      return <ListTag {...baseProps}>{items.map((item, i) => <li key={i}>{item}</li>)}{children}</ListTag>;
    }
    case 'quote':
      return <blockquote {...baseProps}><p>{el.props.content}</p>{el.props.citation && <cite>— {el.props.citation}</cite>}{children}</blockquote>;
    case 'code':
      return <pre {...baseProps}><code>{el.props.content}{children}</code></pre>;
    case 'preformatted':
      return <pre {...baseProps}>{el.props.content}{children}</pre>;
    case 'image':
      return (
        <div {...baseProps}>
          <img src={el.props.src} alt={el.props.alt || ''} style={{ maxWidth: '100%', borderRadius: 'inherit' }} />
          {el.props.caption && <p className="text-xs text-white/50 mt-1 text-center">{el.props.caption}</p>}
          {children}
        </div>
      );
    case 'video':
      return (
        <div {...baseProps}>
          <iframe src={el.props.src} style={{ width: '100%', height: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 'inherit' }} allowFullScreen />
          {el.props.caption && <p className="text-xs text-white/50 mt-1 text-center">{el.props.caption}</p>}
          {children}
        </div>
      );
    case 'cover':
      return (
        <div {...baseProps} style={{ ...style, backgroundImage: `url(${el.props.src})`, position: 'relative' }}>
          {el.props.overlay && <div style={{ position: 'absolute', inset: 0, backgroundColor: el.props.overlay, borderRadius: style.borderRadius }} />}
          <div style={{ position: 'relative', zIndex: 1 }}>{el.props.content}{children}</div>
        </div>
      );
    case 'media-text':
      return (
        <div {...baseProps} style={{ ...style, gridTemplateColumns: el.props.mediaPosition === 'right' ? '1fr 1fr' : '1fr 1fr' }}>
          <img src={el.props.mediaSrc} alt="" style={{ width: '100%', borderRadius: '0.5rem' }} />
          <div>{el.props.content}</div>
          {children}
        </div>
      );
    case 'button':
      return <a {...baseProps} href={el.props.url || '#'} style={{ ...style, textDecoration: 'none' }}>{el.props.label || 'Button'}{children}</a>;
    case 'buttons':
      return (
        <div {...baseProps}>
          {(el.props.buttons as any[])?.map((btn: any, i: number) => (
            <span key={i} style={{
              backgroundColor: btn.variant === 'primary' ? '#7c3aed' : btn.variant === 'secondary' ? 'transparent' : 'transparent',
              color: btn.variant === 'outline' ? '#7c3aed' : '#fff',
              border: btn.variant === 'outline' ? '1px solid #7c3aed' : 'none',
              padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
            }}>{btn.label}</span>
          ))}
          {children}
        </div>
      );
    case 'columns':
    case 'feature-grid':
    case 'gallery':
      return <div {...baseProps}>{children || <span className="text-white/30 text-xs">Drop blocks here</span>}</div>;
    case 'spacer':
      return <div {...baseProps} />;
    case 'separator':
    case 'divider':
      return <hr {...baseProps} />;
    case 'icon':
      return <div {...baseProps} style={{ ...style, fontSize: el.props.size || '2rem' }}>{el.props.icon || '✨'}{children}</div>;
    case 'custom-html':
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: el.props.html || '' }} />;
    default:
      return (
        <div {...baseProps}>
          <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">{el.icon} {el.name}</span>
          {el.props.content || el.props.title || el.name}
          {children}
        </div>
      );
  }
}

export default function VisualBuilderCanvas() {
  const { elements, selectedId, selectElement, zoom, pan, setPan, setZoom, addElement, showGrid, snapToGrid } = useBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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
      setDragPos({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
    }
  }, [pan, zoom]);

  const handleDragLeave = useCallback(() => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
    }
  }, []);

  const handleDragEnter = useCallback(() => {
    dragCounter.current += 1;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    dragCounter.current = 0;
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as BlockDefinition;
      const el: CanvasElement = {
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: data.type,
        name: data.name,
        icon: data.icon,
        props: { ...data.defaultProps },
        styles: { ...data.defaultStyles },
      };
      addElement(el);
    } catch { /* ignore */ }
  }, [addElement]);

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
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: dragPos.x * zoom + pan.x,
            top: dragPos.y * zoom + pan.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-purple-900/50">
            + Drop here
          </div>
        </div>
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
            <div className="max-w-4xl mx-auto">
              {elements.map((el) => renderElement(el, selectedId, selectElement))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
