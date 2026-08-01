import type { BlockRenderer } from './types';

export const navigationRenderers: Record<string, BlockRenderer> = {
  'navbar': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps}><span className="font-bold text-sm">{el.props.logo}</span><div className="flex gap-3 text-xs text-white/60">{(el.props.links as any[] || []).map((l: any, i: number) => <span key={i}>{l.label}</span>)}</div>{children}</div>;
  },
  'sidebar-menu': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps}><div className="space-y-1">{(el.props.items as any[] || []).map((item: any, i: number) => <div key={i} className="flex items-center gap-2 px-2 py-1 rounded text-xs text-white/60 hover:bg-white/5"><span>{item.icon}</span><span>{item.label}</span></div>)}</div>{children}</div>;
  },
  'tab-nav': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps}><div className="flex border-b border-white/10">{(el.props.tabs as any[] || []).map((t: any, i: number) => <span key={i} className={`px-3 py-1 text-[10px] font-semibold ${t.active ? 'text-purple-400 border-b-2 border-purple-500' : 'text-white/40'}`}>{t.label}</span>)}</div>{children}</div>;
  },
  'dropdown-menu': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps}><span className="text-xs text-white/60 border border-white/10 rounded px-2 py-1">{el.props.label} ▾</span>{children}</div>;
  },
  'toc': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps}><p className="text-xs font-semibold text-white/50 mb-1">{el.props.title}</p><div className="space-y-1">{[1, 2, 3].map((i) => <div key={i} className="text-[10px] text-white/40 pl-{(i-1)*2}" style={{ paddingLeft: `${(i-1)*12}px` }}>Section {i}</div>)}</div>{children}</div>;
  },
  'social-share': ({ el, selectedId, selectElement, baseProps, children }) => {

  },
  'hashtag': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <span {...baseProps} style={{ color: '#7c3aed', cursor: 'pointer' }}>#{el.props.tag}{children}</span>;
  },
  'back-to-top': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} className="fixed bottom-6 right-6 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer shadow-lg">⬆{children}</div>;
  },
  'pagination': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} className="flex gap-1 justify-center">{[...Array(Math.min(el.props.total || 5, 5))].map((_, i) => <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs ${i + 1 === (el.props.current || 1) ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'}`}>{i + 1}</span>)}{children}</div>;
  },
};
