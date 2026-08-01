import type { BlockRenderer } from './types';

export const layoutRenderers: Record<string, BlockRenderer> = {
  'columns': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}>{children || <span className="text-white/30 text-xs">Drop blocks here</span>}</div>;
  },
  'section': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <section {...baseProps}>{children || <span className="text-white/30 text-xs">Section — drop blocks here</span>}</section>;
  },
  'container': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ ...style, maxWidth: el.props.maxWidth || '1200px', margin: '0 auto' }}>{children || <span className="text-white/30 text-xs">Container</span>}</div>;
  },
  'wrapper', 'stack': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}>{children || <span className="text-white/30 text-xs">{el.name}</span>}</div>;
  },
  'sidebar-layout': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ ...style, display: 'grid', gridTemplateColumns: el.props.sidebarPosition === 'left' ? `${el.props.sidebarWidth || '300px'} 1fr` : `1fr ${el.props.sidebarWidth || '300px'}`, gap: el.props.gap || '2rem' }}><div className="bg-white/5 rounded p-2 min-h-[100px]"><span className="text-[9px] text-white/20">Sidebar</span></div><div className="bg-white/5 rounded p-2 min-h-[100px]"><span className="text-[9px] text-white/20">Content</span></div>{children}</div>;
  },
  'hero-layout': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ ...style, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: el.props.height || '80vh', textAlign: 'center' }}>{children || <span className="text-white/30 text-xs">Hero Layout</span>}</div>;
  },
  'masonry': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ ...style, columns: el.props.columns || 3, columnGap: el.props.gap || '1rem' }}>{children || <span className="text-white/30 text-xs">Masonry grid</span>}</div>;
  },
};
