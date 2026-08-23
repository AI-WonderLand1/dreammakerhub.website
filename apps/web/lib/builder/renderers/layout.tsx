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
  'wrapper': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}>{children || <span className="text-white/30 text-xs">{el.name}</span>}</div>;
  },
  'stack': ({ el, selectedId, selectElement, baseProps, style, children }) => {
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

  'tabs-section': ({ el, baseProps, style, children }) => (
    <section {...baseProps} style={style}>
      <div role="tablist" style={{ display: 'flex', gap: '0.25rem', borderBottom: el.props.variant === 'underline' ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
        {(el.props.tabs || []).map((t: any, i: number) => {
          const active = i === (el.props.active || 0);
          return (
            <button key={i} role="tab" aria-selected={active} style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 0, borderRadius: el.props.variant === 'pills' ? 999 : 0, background: el.props.variant === 'pills' && active ? '#7c3aed' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.55)', borderBottom: el.props.variant === 'underline' && active ? '2px solid #a855f7' : '2px solid transparent' }}>{t.label}</button>
          );
        })}
      </div>
      <div role="tabpanel" style={{ paddingTop: '1rem' }}>{children}</div>
    </section>
  ),
  'accordion-section': ({ el, baseProps, style, children }) => (
    <section {...baseProps} style={style}>
      {(el.props.items || []).map((item: any, i: number) => (
        <details key={i} open={el.props.singleOpen !== false ? i === 0 : false} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{item.title}</summary>
          <p style={{ opacity: 0.75, marginTop: '0.5rem' }}>{item.content}</p>
        </details>
      ))}
      {children}
    </section>
  ),
  'modal-trigger': ({ el, baseProps, style }) => (
    <span {...baseProps} style={style}>
      <button type="button" onClick={() => {}} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold" style={{ color: '#fff', border: 0, cursor: 'pointer' }}>{el.props.buttonLabel}</button>
    </span>
  ),
  'sticky-cta-bar': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={{ ...style, top: el.props.position === 'top' ? 0 : undefined, bottom: el.props.position === 'bottom' ? 0 : undefined }}>
      <strong>{el.props.text}</strong>
      <a href={el.props.href || '#'} className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-xs font-bold no-underline" style={{ color: '#fff' }}>{el.props.cta}</a>
      {children}
    </div>
  ),
  'split-screen': ({ el, baseProps, style, children }) => (
    <section {...baseProps} style={{ ...style, display: 'flex' }}>
      {children}
    </section>
  ),
  'masonry-grid': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={{ ...style, columnCount: el.props.columns || 3 }}>{children}</div>
  ),
  'spacer-block': ({ el, baseProps }) => (
    <div {...baseProps} aria-hidden="true" style={{ height: `${el.props.height ?? 64}px`, borderTop: el.props.showGuides ? '1px dashed rgba(168,85,247,0.35)' : 'none' }} />
  ),
  'divider-styled': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <span style={{ flex: 1, height: `${el.props.thickness ?? 2}px`, background: el.props.style === 'gradient' ? 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' : 'rgba(255,255,255,0.12)' }} />
      {el.props.label && <span style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>{el.props.label}</span>}
      <span style={{ flex: 1, height: `${el.props.thickness ?? 2}px`, background: el.props.style === 'gradient' ? 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' : 'rgba(255,255,255,0.12)' }} />
    </div>
  ),
  'bento-grid': ({ el, baseProps, style }) => (
    <div {...baseProps} style={{ ...style, gridTemplateColumns: `repeat(${el.props.columns || 4}, 1fr)` }}>
      {(el.props.tiles || []).map((t: any, i: number) => (
        <div key={i} style={{ gridColumn: `span ${t.span || 1}`, minHeight: 110, borderRadius: '0.8rem', padding: '1rem', background: 'linear-gradient(145deg, rgba(139,92,246,0.10), rgba(34,211,238,0.05))', border: '1px solid rgba(255,255,255,0.09)' }}>
          <strong>{t.title}</strong>
        </div>
      ))}
    </div>
  ),
  'hero-split': ({ el, baseProps, style }) => {
    const media = (
      <div key="m" style={{ aspectRatio: '16/10', borderRadius: '1rem', background: el.props.imageUrl ? `url(${el.props.imageUrl}) center/cover` : 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(168,85,247,0.15))', border: '1px solid rgba(255,255,255,0.1)' }} />
    );
    const copy = (
      <div key="c">
        {el.props.eyebrow && <span style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.18em', color: '#22d3ee', marginBottom: '0.5rem' }}>{el.props.eyebrow}</span>}
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.05, margin: '0 0 0.75rem' }}>{el.props.headline}</h1>
        <p style={{ opacity: 0.65, margin: '0 0 1.25rem' }}>{el.props.sub}</p>
        <a href={el.props.hrefPrimary || '#'} className="inline-block rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold no-underline" style={{ color: '#fff' }}>{el.props.ctaPrimary}</a>
      </div>
    );
    return <section {...baseProps} style={style}>{el.props.flip ? [media, copy] : [copy, media]}</section>;
  },
  'section-columns': ({ el, baseProps, style, children }) => (
    <section {...baseProps} style={{ ...style, gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, alignItems: el.props.align || 'stretch' }}>{children}</section>
  ),
  'scroll-container': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={{ ...style, maxHeight: `${el.props.maxHeightPx ?? 320}px` }}>{children}</div>
  ),
};
