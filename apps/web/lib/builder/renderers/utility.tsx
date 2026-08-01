import type { BlockRenderer } from './types';

export const utilityRenderers: Record<string, BlockRenderer> = {
  'image': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return (
        <div {...baseProps}>
          <img src={el.props.src} alt={el.props.alt || ''} style={{ maxWidth: '100%', borderRadius: 'inherit' }} />
          {el.props.caption && <p className="text-xs text-white/50 mt-1 text-center">{el.props.caption}</p>}
          {children}
        </div>
      );
  },
  'spacer': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} />;
  },
  'separator': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <hr {...baseProps} />;
  },
  'divider': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <hr {...baseProps} />;
  },
  'custom-html': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: el.props.html || '' }} />;
  },
  'accordion': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const accItems = (el.props.items as any[]) || [];
      return (
        <div {...baseProps} role="region" aria-label={el.props.title || 'Accordion'}>
          {accItems.map((item: any, i: number) => (
            <AccordionItem key={i} title={item.q || item.title} content={item.a || item.content} />
          ))}
        </div>
      );
  },
  'faq': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const accItems = (el.props.items as any[]) || [];
      return (
        <div {...baseProps} role="region" aria-label={el.props.title || 'Accordion'}>
          {accItems.map((item: any, i: number) => (
            <AccordionItem key={i} title={item.q || item.title} content={item.a || item.content} />
          ))}
        </div>
      );
  },
  'tabs': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const tabItems = (el.props.tabs as any[]) || [];
      return <TabsContainer {...baseProps} tabs={tabItems} />;
  },
  'modal': ({ el, selectedId, selectElement, baseProps, style, children }) => {
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
  },
  'skip-to-content': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return (
        <a {...baseProps} href={el.props.target || '#main-content'} style={{ ...style, position: 'absolute', left: '-9999px', zIndex: 50 }} className="builder-element skip-link">
          {el.props.label || 'Skip to content'}
        </a>
      );
  },
  'textarea': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><label className="block text-xs text-white/50 mb-1">{el.props.label}</label><textarea placeholder={el.props.placeholder} rows={el.props.rows || 4} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /></div>;
  },
  'card': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}>{el.props.image && <img src={el.props.image} className="w-full h-32 object-cover rounded-t" />}<div className="p-3"><p className="text-sm font-semibold">{el.props.title}</p><p className="text-xs text-white/50 mt-1">{el.props.content}</p></div>{children}</div>;
  },
  'cookie-consent': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#1e293b] px-4 py-2 text-xs flex items-center justify-between"><span>{el.props.message}</span><div className="flex gap-2"><span className="rounded bg-purple-600 px-2 py-0.5">{el.props.acceptText}</span><span className="rounded border border-white/10 px-2 py-0.5">{el.props.declineText}</span></div>{children}</div>;
  },
  'lightbox': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="inline-block cursor-pointer"><img src={(el.props.images as string[] || [])[0] || 'https://picsum.photos/200/150'} className="w-32 h-24 object-cover rounded" /></div>;
  },
  'ai-text': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300/70"><span className="font-semibold">{el.icon} {el.name}</span> — {el.props.prompt || el.props.text?.slice(0, 60)}{children}</div>;
  },
  'ai-chat': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300/70"><span className="font-semibold">{el.icon} {el.name}</span> — {el.props.prompt || el.props.text?.slice(0, 60)}{children}</div>;
  },
  'ai-translate': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300/70"><span className="font-semibold">{el.icon} {el.name}</span> — {el.props.prompt || el.props.text?.slice(0, 60)}{children}</div>;
  },
  'ai-summarize': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300/70"><span className="font-semibold">{el.icon} {el.name}</span> — {el.props.prompt || el.props.text?.slice(0, 60)}{children}</div>;
  },
  'ai-code': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300/70"><span className="font-semibold">{el.icon} {el.name}</span> — {el.props.prompt || el.props.text?.slice(0, 60)}{children}</div>;
  },
  'ai-rewrite': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300/70"><span className="font-semibold">{el.icon} {el.name}</span> — {el.props.prompt || el.props.text?.slice(0, 60)}{children}</div>;
  },
  'ai-extract': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300/70"><span className="font-semibold">{el.icon} {el.name}</span> — {el.props.prompt || el.props.text?.slice(0, 60)}{children}</div>;
  },
  'html': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: el.props.html || '' }} />;
  },
  'shortcode': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#a78bfa' }}>{el.props.shortcode}{children}</div>;
  },
  'php': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#a5b4fc' }}>🐘 {el.props.code?.slice(0, 60)}{children}</div>;
  },
  'conditional': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="border border-yellow-500/20 bg-yellow-500/5 rounded p-2 text-xs text-yellow-300/70">🔀 Conditional: {el.props.condition}{children}</div>;
  },
  'embed': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-white/10 p-4 text-center text-xs text-white/40">🔗 Embed URL{children}</div>;
  },
  'map': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-white/10 h-48 bg-white/5 flex items-center justify-center"><span className="text-2xl">🗺️</span>{children}</div>;
  },
};
