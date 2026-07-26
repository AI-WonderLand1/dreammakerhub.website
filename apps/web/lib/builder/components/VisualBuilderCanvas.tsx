'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useBuilderStore } from '../store';
import { CanvasElement, BlockDefinition } from '../types';

function AccordionItem({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  const panelId = `acc-panel-${Math.random().toString(36).slice(2, 6)}`;
  const headerId = `acc-hdr-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div className="border-b border-white/10">
      <button
        id={headerId}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-white/80 hover:text-white transition-colors"
      >
        {title}
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!open}
        className="px-3 pb-2 text-[11px] text-white/50"
      >
        {content}
      </div>
    </div>
  );
}

function TabsContainer({ tabs, ...baseProps }: { tabs: { label: string; content: string }[]; [key: string]: any }) {
  const [active, setActive] = useState(0);
  const tabListId = `tablist-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div {...baseProps}>
      <div role="tablist" aria-label="Content tabs" className="flex border-b border-white/10">
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={active === i}
            aria-controls={`${tabListId}-panel-${i}`}
            onClick={(e) => { e.stopPropagation(); setActive(i); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); setActive((i + 1) % tabs.length); }
              if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((i - 1 + tabs.length) % tabs.length); }
            }}
            className={`px-3 py-1.5 text-[10px] font-semibold transition-colors ${
              active === i ? 'border-b-2 border-purple-500 text-purple-300' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={i}
          id={`${tabListId}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${tabListId}-tab-${i}`}
          hidden={active !== i}
          className="px-3 py-2 text-xs text-white/60"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

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
      return <div {...baseProps}>{children || <span className="text-white/30 text-xs">Drop blocks here</span>}</div>;
    case 'gallery':
      return <div {...baseProps}><div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '0.75rem' }}>{(el.props.images as string[] || []).map((src: string, i: number) => <div key={i} className="aspect-video bg-white/5 rounded overflow-hidden"><img src={src} alt="" className="w-full h-full object-cover" /></div>)}</div>{children}</div>;
    case 'spacer':
      return <div {...baseProps} />;
    case 'separator':
    case 'divider':
      return <hr {...baseProps} />;
    case 'icon':
      return <div {...baseProps} style={{ ...style, fontSize: el.props.size || '2rem' }}>{el.props.icon || '✨'}{children}</div>;
    case 'custom-html':
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: el.props.html || '' }} />;
    case 'accordion':
    case 'faq':
      const accItems = (el.props.items as any[]) || [];
      return (
        <div {...baseProps} role="region" aria-label={el.props.title || 'Accordion'}>
          {accItems.map((item: any, i: number) => (
            <AccordionItem key={i} title={item.q || item.title} content={item.a || item.content} />
          ))}
        </div>
      );
    case 'tabs':
      const tabItems = (el.props.tabs as any[]) || [];
      return <TabsContainer {...baseProps} tabs={tabItems} />;
    case 'modal':
      return (
        <div {...baseProps}>
          <button
            className="rounded bg-purple-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-purple-500 transition-colors"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); const d = document.getElementById(`modal-${el.id}`); if (d) d.style.display = 'flex'; }}
            aria-haspopup="dialog"
          >
            {el.props.triggerText || 'Open Modal'}
          </button>
          <div
            id={`modal-${el.id}`}
            style={{ display: 'none' }}
            className="fixed inset-0 z-50 items-center justify-center bg-black/70"
            role="dialog"
            aria-modal="true"
            aria-label={el.props.title}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') { (e.target as HTMLElement).style.display = 'none'; } }}
          >
            <div className="bg-[#1e293b] rounded-xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">{el.props.title}</h3>
                <button onClick={() => { const d = document.getElementById(`modal-${el.id}`); if (d) d.style.display = 'none'; }} className="text-white/40 hover:text-white/80 text-xs px-1" aria-label="Close modal">✕</button>
              </div>
              <p className="text-xs text-white/70">{el.props.content}</p>
            </div>
          </div>
        </div>
      );
    case 'skip-to-content':
      return (
        <a {...baseProps} href={el.props.target || '#main-content'} style={{ ...style, position: 'absolute', left: '-9999px', zIndex: 50 }} className="builder-element skip-link">
          {el.props.label || 'Skip to content'}
        </a>
      );
    case 'hero':
    case 'cta':
      return <div {...baseProps}><h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{el.props.title}</h2><p style={{ opacity: 0.7, marginBottom: '1rem' }}>{el.props.subtitle}</p><span className="inline-block rounded bg-purple-600 text-white px-4 py-2 text-sm font-semibold">{el.props.cta || el.props.buttonText}</span>{children}</div>;
    case 'testimonial':
      return <div {...baseProps}>{el.props.quote && <p className="italic text-sm mb-2">"{el.props.quote}"</p>}<p className="text-xs text-white/50">— {el.props.author}{el.props.role ? `, ${el.props.role}` : ''}</p>{children}</div>;
    case 'pricing':
      return <div {...baseProps} className={el.props.highlighted ? 'ring-2 ring-purple-500' : ''}><p className="text-3xl font-bold">{el.props.price}<span className="text-xs text-white/40">{el.props.interval}</span></p><p className="text-sm font-semibold mt-2">{el.props.plan}</p><ul className="text-[11px] text-white/60 mt-2 space-y-1">{(el.props.features as string[] || []).map((f: string, i: number) => <li key={i}>✓ {f}</li>)}</ul><span className="inline-block mt-3 rounded bg-purple-600 text-white px-3 py-1 text-xs">{el.props.cta}</span>{children}</div>;
    case 'team-grid':
      return <div {...baseProps}><div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>{(el.props.members as any[] || []).map((m: any, i: number) => <div key={i} className="text-center p-2"><div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-1" /><p className="text-xs font-medium">{m.name}</p><p className="text-[9px] text-white/40">{m.role}</p></div>)}</div>{children}</div>;
    case 'logo-cloud':
      return <div {...baseProps}><div className="flex justify-center gap-6 flex-wrap">{(el.props.logos as string[] || []).map((l: string, i: number) => <span key={i} className="text-sm text-white/40 px-4 py-2 bg-white/5 rounded">{l}</span>)}</div>{children}</div>;
    case 'alert':
      const alertColors: Record<string, string> = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' };
      return <div {...baseProps} style={{ ...style, borderLeftColor: alertColors[el.props.type] || '#3b82f6', borderLeftWidth: '3px' }}><span style={{ fontSize: '0.875rem' }}>{el.props.content}</span>{children}</div>;
    case 'stats-section':
      return <div {...baseProps}><div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>{(el.props.stats as any[] || []).map((s: any, i: number) => <div key={i} className="text-center"><p className="text-2xl font-bold text-purple-400">{s.number}</p><p className="text-xs text-white/50">{s.label}</p></div>)}</div>{children}</div>;
    case 'count-up':
      return <div {...baseProps}><p className="text-3xl font-bold text-purple-400">{el.props.number}{el.props.suffix}</p><p className="text-sm text-white/50">{el.props.label}</p>{children}</div>;
    case 'progress':
      const pct = Math.min(100, Math.max(0, Number(el.props.value) || 0));
      return <div {...baseProps}><div className="flex items-center justify-between text-xs text-white/50 mb-1"><span>{el.props.label}</span><span>{pct}%</span></div><div className="w-full h-2 rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: el.props.color || '#7c3aed' }} /></div>{children}</div>;
    case 'chart':
      const chartData = (el.props.data as number[] || []);
      const chartLabels = (el.props.labels as string[] || []);
      return <div {...baseProps}><p className="text-xs font-semibold text-white/70 mb-2">{el.props.title}</p><div className="flex items-end gap-2 h-24">{(el.props.type === 'bar' ? chartData : chartData.slice(0, 5)).map((v: number, i: number) => <div key={i} className="flex-1 flex flex-col items-center"><div className="w-full rounded-t bg-purple-500/60" style={{ height: `${Math.max(8, (v / Math.max(...chartData)) * 80)}px` }} /><span className="text-[8px] text-white/30 mt-0.5">{chartLabels[i] || ''}</span></div>)}</div>{children}</div>;
    case 'navbar':
      return <div {...baseProps}><span className="font-bold text-sm">{el.props.logo}</span><div className="flex gap-3 text-xs text-white/60">{(el.props.links as any[] || []).map((l: any, i: number) => <span key={i}>{l.label}</span>)}</div>{children}</div>;
    case 'sidebar-menu':
      return <div {...baseProps}><div className="space-y-1">{(el.props.items as any[] || []).map((item: any, i: number) => <div key={i} className="flex items-center gap-2 px-2 py-1 rounded text-xs text-white/60 hover:bg-white/5"><span>{item.icon}</span><span>{item.label}</span></div>)}</div>{children}</div>;
    case 'tab-nav':
      return <div {...baseProps}><div className="flex border-b border-white/10">{(el.props.tabs as any[] || []).map((t: any, i: number) => <span key={i} className={`px-3 py-1 text-[10px] font-semibold ${t.active ? 'text-purple-400 border-b-2 border-purple-500' : 'text-white/40'}`}>{t.label}</span>)}</div>{children}</div>;
    case 'dropdown-menu':
      return <div {...baseProps}><span className="text-xs text-white/60 border border-white/10 rounded px-2 py-1">{el.props.label} ▾</span>{children}</div>;
    case 'toc':
      return <div {...baseProps}><p className="text-xs font-semibold text-white/50 mb-1">{el.props.title}</p><div className="space-y-1">{[1, 2, 3].map((i) => <div key={i} className="text-[10px] text-white/40 pl-{(i-1)*2}" style={{ paddingLeft: `${(i-1)*12}px` }}>Section {i}</div>)}</div>{children}</div>;
    case 'section':
      return <section {...baseProps}>{children || <span className="text-white/30 text-xs">Section — drop blocks here</span>}</section>;
    case 'container':
      return <div {...baseProps} style={{ ...style, maxWidth: el.props.maxWidth || '1200px', margin: '0 auto' }}>{children || <span className="text-white/30 text-xs">Container</span>}</div>;
    case 'wrapper':
    case 'stack':
      return <div {...baseProps}>{children || <span className="text-white/30 text-xs">{el.name}</span>}</div>;
    case 'sidebar-layout':
      return <div {...baseProps} style={{ ...style, display: 'grid', gridTemplateColumns: el.props.sidebarPosition === 'left' ? `${el.props.sidebarWidth || '300px'} 1fr` : `1fr ${el.props.sidebarWidth || '300px'}`, gap: el.props.gap || '2rem' }}><div className="bg-white/5 rounded p-2 min-h-[100px]"><span className="text-[9px] text-white/20">Sidebar</span></div><div className="bg-white/5 rounded p-2 min-h-[100px]"><span className="text-[9px] text-white/20">Content</span></div>{children}</div>;
    case 'hero-layout':
      return <div {...baseProps} style={{ ...style, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: el.props.height || '80vh', textAlign: 'center' }}>{children || <span className="text-white/30 text-xs">Hero Layout</span>}</div>;
    case 'masonry':
      return <div {...baseProps} style={{ ...style, columns: el.props.columns || 3, columnGap: el.props.gap || '1rem' }}>{children || <span className="text-white/30 text-xs">Masonry grid</span>}</div>;
    case 'input':
      return <div {...baseProps}><label className="block text-xs text-white/50 mb-1">{el.props.label}</label><input type={el.props.type || 'text'} placeholder={el.props.placeholder} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /></div>;
    case 'textarea':
      return <div {...baseProps}><label className="block text-xs text-white/50 mb-1">{el.props.label}</label><textarea placeholder={el.props.placeholder} rows={el.props.rows || 4} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /></div>;
    case 'select':
      return <div {...baseProps}><label className="block text-xs text-white/50 mb-1">{el.props.label}</label><select className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white">{(el.props.options as string[] || []).map((o: string, i: number) => <option key={i}>{o}</option>)}</select></div>;
    case 'checkbox':
      return <div {...baseProps} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={el.props.checked || false} readOnly /><span className="text-xs text-white/70">{el.props.label}</span>{children}</div>;
    case 'radio':
      return <div {...baseProps}><p className="text-xs text-white/50 mb-1">{el.props.label}</p>{(el.props.options as string[] || []).map((o: string, i: number) => <label key={i} className="flex items-center gap-2 text-xs text-white/60"><input type="radio" name={el.id} defaultChecked={i === 0} />{o}</label>)}{children}</div>;
    case 'toggle':
      return <div {...baseProps} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div className={`w-8 h-4 rounded-full transition-colors ${el.props.enabled ? 'bg-purple-600' : 'bg-white/20'}`}><div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${el.props.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} /></div><span className="text-xs text-white/70">{el.props.label}</span>{children}</div>;
    case 'badge':
      const badgeColors: Record<string, string> = { primary: '#7c3aed', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
      return <span {...baseProps} style={{ ...style, backgroundColor: badgeColors[el.props.variant] || badgeColors.primary }}>{el.props.content}{children}</span>;
    case 'tooltip':
      return <span {...baseProps} style={{ ...style, borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{el.props.text}<span className="text-[9px] text-white/30 ml-1">ⓘ</span>{children}</span>;
    case 'marquee':
      return <div {...baseProps} style={{ ...style, overflow: 'hidden' }}><div className="animate-marquee">{el.props.content}{children}</div></div>;
    case 'icon-list':
      return <div {...baseProps}>{(el.props.items as any[] || []).map((item: any, i: number) => <div key={i} className="flex items-center gap-2 text-xs text-white/70 mb-1"><span>{item.icon}</span><span>{item.text}</span></div>)}{children}</div>;
    case 'product-card':
      return <div {...baseProps}><div className="w-full h-32 bg-white/5 rounded mb-2" /><p className="text-sm font-semibold">{el.props.name}</p><p className="text-lg font-bold text-purple-400">{el.props.price}</p>{children}</div>;
    case 'product-grid':
      return <div {...baseProps} style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '1rem' }}>{Array.from({ length: el.props.count || 6 }).map((_, i) => <div key={i} className="bg-white/5 rounded p-3"><div className="w-full h-20 bg-white/5 rounded mb-1" /><div className="h-3 w-2/3 bg-white/10 rounded mb-1" /><div className="h-3 w-1/3 bg-purple-500/30 rounded" /></div>)}{children}</div>;
    case 'add-to-cart':
      return <button {...baseProps} className="rounded bg-purple-600 text-white px-4 py-2 text-sm font-semibold">{el.props.label || 'Add to Cart'}{children}</button>;
    case 'product-page':
      return <div {...baseProps} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}><div className="bg-white/5 rounded aspect-square" /><div><p className="text-xl font-bold">{el.props.name}</p><p className="text-2xl font-bold text-purple-400 mt-1">{el.props.price}</p><p className="text-xs text-white/50 mt-2">{el.props.description}</p></div>{children}</div>;
    case 'product-filter':
      return <div {...baseProps}><div className="flex gap-2">{(el.props.sortOptions as string[] || []).map((o: string, i: number) => <span key={i} className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/40">{o}</span>)}</div>{children}</div>;
    case 'product-badge':
      return <span {...baseProps} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.625rem', fontWeight: 700 }}>{el.props.text}{children}</span>;
    case 'stock-indicator':
      const stockStatus = el.props.status || 'in-stock';
      return <div {...baseProps}><span className={`inline-block w-2 h-2 rounded-full mr-1 ${stockStatus === 'in-stock' ? 'bg-green-400' : stockStatus === 'out-of-stock' ? 'bg-red-400' : 'bg-yellow-400'}`} /><span className="text-xs">{stockStatus === 'in-stock' ? `In Stock (${el.props.quantity || 0})` : stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Pre-order'}</span>{children}</div>;
    case 'download-button':
      return <a {...baseProps} className="inline-flex items-center gap-2 rounded bg-purple-600 text-white px-3 py-1.5 text-xs font-semibold no-underline">{el.props.label} ⬇{children}</a>;
    case 'search':
    case 'product-search':
      return <div {...baseProps} style={{ display: 'flex', gap: '0.5rem' }}><input type="text" placeholder={el.props.placeholder || 'Search...'} className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /><button className="rounded bg-purple-600 text-white px-2 text-xs">{el.props.buttonText || '🔍'}</button>{children}</div>;
    case 'card':
      return <div {...baseProps}>{el.props.image && <img src={el.props.image} className="w-full h-32 object-cover rounded-t" />}<div className="p-3"><p className="text-sm font-semibold">{el.props.title}</p><p className="text-xs text-white/50 mt-1">{el.props.content}</p></div>{children}</div>;
    case 'step':
    case 'steps':
      return <div {...baseProps}><div className="flex gap-4">{(el.props.steps as any[] || []).map((s: any, i: number) => <div key={i} className="flex-1 text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center mx-auto text-sm font-bold">{i + 1}</div><p className="text-xs font-medium mt-1">{s.title}</p><p className="text-[10px] text-white/40">{s.desc}</p></div>)}</div>{children}</div>;
    case 'author-box':
      return <div {...baseProps} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}><div className="w-12 h-12 rounded-full bg-white/10 shrink-0" /><div><p className="text-sm font-semibold">{el.props.name}</p><p className="text-[10px] text-white/40">{el.props.role}</p><p className="text-xs text-white/50 mt-1">{el.props.bio}</p></div>{children}</div>;
    case 'feature-grid':
      return <div {...baseProps}><div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '1.5rem' }}>{(el.props.features as any[] || []).map((f: any, i: number) => <div key={i} className="text-center"><span className="text-2xl">{f.icon}</span><p className="text-sm font-semibold mt-1">{f.title}</p><p className="text-[10px] text-white/40 mt-0.5">{f.desc}</p></div>)}</div>{children}</div>;
    case 'order-summary':
      return <div {...baseProps}><div className="space-y-1">{(el.props.items as any[] || []).map((item: any, i: number) => <div key={i} className="flex justify-between text-xs text-white/60"><span>{item.name} x{item.qty}</span><span>{item.price}</span></div>)}</div><div className="border-t border-white/10 mt-2 pt-2 flex justify-between text-sm font-bold"><span>Total</span><span className="text-purple-400">{el.props.total}</span></div>{children}</div>;
    case 'wishlist':
      return <button {...baseProps} className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs text-pink-400">♡ {el.props.label}{children}</button>;
    case 'coupon':
      return <div {...baseProps} className="flex gap-2"><input type="text" placeholder={el.props.placeholder} className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs" /><button className="rounded bg-purple-600 text-white px-2 text-xs">{el.props.buttonText}</button>{children}</div>;
    case 'size-selector':
      return <div {...baseProps} className="flex gap-1">{(el.props.sizes as string[] || []).map((s: string, i: number) => <span key={i} className={`px-2 py-1 rounded text-xs border ${s === el.props.selected ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 text-white/50'}`}>{s}</span>)}{children}</div>;
    case 'color-swatches':
      return <div {...baseProps} className="flex gap-1">{(el.props.colors as any[] || []).map((c: any, i: number) => <div key={i} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: c.value, borderColor: c.value === el.props.selected ? '#7c3aed' : 'rgba(255,255,255,0.2)' }} />)}{children}</div>;
    case 'weather':
      return <div {...baseProps}><div className="flex items-center gap-3"><span className="text-3xl">🌤️</span><div><p className="text-2xl font-bold">22°</p><p className="text-xs text-white/50">{el.props.location}</p></div></div>{children}</div>;
    case 'clock':
      return <div {...baseProps} style={{ ...style, fontFamily: 'monospace' }}>12:00:00{children}</div>;
    case 'timer':
      return <div {...baseProps}><div className="flex gap-2 justify-center">{[...Array(4)].map((_, i) => <div key={i} className="text-center"><div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-lg font-bold">00</div><p className="text-[8px] text-white/30 mt-0.5">{['Days','Hours','Mins','Secs'][i]}</p></div>)}</div>{children}</div>;
    case 'qr-code':
      return <div {...baseProps} className="flex justify-center"><div className="w-32 h-32 bg-white rounded flex items-center justify-center"><span className="text-[8px] text-black/40 text-center px-2">{el.props.text || 'QR Content'}</span></div>{children}</div>;
    case 'social-share':
    case 'social-feed':
      return <div {...baseProps}><div className="flex gap-2">{(el.props.platforms || el.props.sources || ['twitter', 'facebook']).slice(0, 4).map((p: string, i: number) => <span key={i} className="text-lg opacity-60">{['🐦', '📘', '💼', '📷'][i] || '🔗'}</span>)}</div>{children}</div>;
    case 'whatsapp-share':
      return <div {...baseProps} className="inline-flex items-center gap-1 rounded bg-[#25D366] text-white px-2 py-1 text-xs font-semibold">📱 {el.props.text || 'Share'}{children}</div>;
    case 'telegram-share':
      return <div {...baseProps} className="inline-flex items-center gap-1 rounded bg-[#0088cc] text-white px-2 py-1 text-xs font-semibold">✈️ {el.props.text || 'Share'}{children}</div>;
    case 'youtube-sub':
      return <div {...baseProps} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold">▶ {el.props.channelName}{children}</div>;
    case 'discord-invite':
      return <div {...baseProps} className="flex items-center gap-2 px-3 py-2 rounded bg-[#5865F2]/20 border border-[#5865F2]/30 text-xs"><span className="text-lg">💬</span><span className="font-semibold">{el.props.serverName}</span>{children}</div>;
    case 'github-star':
      return <div {...baseProps} className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs">⭐ {el.props.repo}{children}</div>;
    case 'facebook-page':
      return <div {...baseProps} className="rounded border border-white/10 p-3 text-xs text-center text-white/50">📘 {el.props.pageUrl || 'Facebook Page'}{children}</div>;
    case 'twitter-timeline':
      return <div {...baseProps} className="rounded border border-white/10 p-3 text-xs text-center text-white/50">🐦 @{el.props.username || 'username'}{children}</div>;
    case 'toast':
    case 'banner':
    case 'announcement-bar':
      return <div {...baseProps} className="text-center text-xs font-medium px-3 py-1.5">{el.props.message || el.props.text}{children}</div>;
    case 'push-notification':
      return <div {...baseProps} className="rounded border border-white/10 p-3 text-center"><p className="text-sm font-semibold">{el.props.title}</p><p className="text-xs text-white/50 mt-1">{el.props.message}</p><div className="flex gap-2 justify-center mt-2"><span className="rounded bg-purple-600 px-2 py-0.5 text-[10px]">{el.props.acceptText}</span><span className="rounded bg-white/10 px-2 py-0.5 text-[10px]">{el.props.declineText}</span></div>{children}</div>;
    case 'live-alert':
      return <div {...baseProps} className="text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />{el.props.message}{children}</div>;
    case 'login-form':
    case 'register-form':
    case 'password-reset':
      return <div {...baseProps} className="max-w-xs mx-auto"><p className="text-sm font-semibold mb-2">{el.props.title}</p><div className="space-y-2"><div className="h-7 rounded border border-white/10 bg-black/40" /><div className="h-7 rounded border border-white/10 bg-black/40" /></div><div className="mt-2 rounded bg-purple-600 text-white text-center py-1 text-xs font-semibold">{el.props.submitText}</div></div>{children}</div>;
    case 'oauth-buttons':
      return <div {...baseProps} className="space-y-1">{(el.props.providers as string[] || []).map((p: string, i: number) => <div key={i} className="flex items-center gap-2 rounded border border-white/10 px-2 py-1 text-xs text-white/60"><span>{['🔵', '🐙', '🔵'][i] || '🔗'}</span><span className="capitalize">{p}</span></div>)}{children}</div>;
    case 'meta-tags':
    case 'schema-markup':
    case 'ga-tracking':
    case 'facebook-pixel':
    case 'gtm':
    case 'matomo':
      return <div {...baseProps} style={{ display: 'none' }} />;
    case 'cookie-consent':
      return <div {...baseProps} className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#1e293b] px-4 py-2 text-xs flex items-center justify-between"><span>{el.props.message}</span><div className="flex gap-2"><span className="rounded bg-purple-600 px-2 py-0.5">{el.props.acceptText}</span><span className="rounded border border-white/10 px-2 py-0.5">{el.props.declineText}</span></div>{children}</div>;
    case 'lightbox':
      return <div {...baseProps} className="inline-block cursor-pointer"><img src={(el.props.images as string[] || [])[0] || 'https://picsum.photos/200/150'} className="w-32 h-24 object-cover rounded" /></div>;
    case 'video-bg':
      return <div {...baseProps} style={{ position: 'relative', overflow: 'hidden' }}><div className="absolute inset-0 bg-black/40" /><div className="relative z-10 p-8 text-center text-white"><p className="text-lg font-bold">Video Background</p></div>{children}</div>;
    case 'image-carousel':
      return <div {...baseProps} className="relative"><div className="aspect-video bg-white/5 rounded flex items-center justify-center"><span className="text-4xl">🖼️</span></div><div className="flex justify-center gap-1 mt-2">{((el.props.images || []) as string[]).map((_: any, i: number) => <div key={i} className="w-2 h-2 rounded-full bg-white/30" />)}</div>{children}</div>;
    case 'image-compare':
      return <div {...baseProps} className="relative aspect-video bg-white/5 rounded overflow-hidden"><div className="absolute inset-0 flex"><div className="flex-1" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} /><div className="flex-1" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} /></div><div className="absolute inset-y-0 left-1/2 w-0.5 bg-white shadow-lg" /><span className="absolute top-2 left-2 text-[9px] text-white/80 bg-black/50 px-1 rounded">Before</span><span className="absolute top-2 right-2 text-[9px] text-white/80 bg-black/50 px-1 rounded">After</span>{children}</div>;
    case 'ai-image':
      return <div {...baseProps} className="rounded border border-purple-500/30 bg-purple-500/5 p-3 text-center"><span className="text-3xl">🎨</span><p className="text-xs text-purple-400 mt-1">AI: {el.props.prompt?.slice(0, 40)}</p>{children}</div>;
    case 'ai-text':
    case 'ai-chat':
    case 'ai-translate':
    case 'ai-summarize':
    case 'ai-code':
    case 'ai-rewrite':
    case 'ai-extract':
      return <div {...baseProps} className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300/70"><span className="font-semibold">{el.icon} {el.name}</span> — {el.props.prompt || el.props.text?.slice(0, 60)}{children}</div>;
    case 'html':
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: el.props.html || '' }} />;
    case 'shortcode':
      return <div {...baseProps} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#a78bfa' }}>{el.props.shortcode}{children}</div>;
    case 'php':
      return <div {...baseProps} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#a5b4fc' }}>🐘 {el.props.code?.slice(0, 60)}{children}</div>;
    case 'conditional':
      return <div {...baseProps} className="border border-yellow-500/20 bg-yellow-500/5 rounded p-2 text-xs text-yellow-300/70">🔀 Conditional: {el.props.condition}{children}</div>;
    case 'hashtag':
      return <span {...baseProps} style={{ color: '#7c3aed', cursor: 'pointer' }}>#{el.props.tag}{children}</span>;
    case 'back-to-top':
      return <div {...baseProps} className="fixed bottom-6 right-6 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer shadow-lg">⬆{children}</div>;
    case 'pagination':
      return <div {...baseProps} className="flex gap-1 justify-center">{[...Array(Math.min(el.props.total || 5, 5))].map((_, i) => <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs ${i + 1 === (el.props.current || 1) ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'}`}>{i + 1}</span>)}{children}</div>;
    case 'embed':
      return <div {...baseProps} className="rounded border border-white/10 p-4 text-center text-xs text-white/40">🔗 Embed URL{children}</div>;
    case 'map':
      return <div {...baseProps} className="rounded border border-white/10 h-48 bg-white/5 flex items-center justify-center"><span className="text-2xl">🗺️</span>{children}</div>;
    case 'lottie':
      return <div {...baseProps} className="flex items-center justify-center"><span className="text-4xl">🎞️</span>{children}</div>;
    case 'svg':
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: el.props.svg || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/></svg>' }} />;
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
