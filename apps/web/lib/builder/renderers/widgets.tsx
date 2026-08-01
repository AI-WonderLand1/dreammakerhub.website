import type { BlockRenderer } from './types';

export const widgetsRenderers: Record<string, BlockRenderer> = {
  'select': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><label className="block text-xs text-white/50 mb-1">{el.props.label}</label><select className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white">{(el.props.options as string[] || []).map((o: string, i: number) => <option key={i}>{o}</option>)}</select></div>;
  },
  'toggle': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div className={`w-8 h-4 rounded-full transition-colors ${el.props.enabled ? 'bg-purple-600' : 'bg-white/20'}`}><div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${el.props.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} /></div><span className="text-xs text-white/70">{el.props.label}</span>{children}</div>;
  },
  'weather': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="flex items-center gap-3"><span className="text-3xl">🌤️</span><div><p className="text-2xl font-bold">22°</p><p className="text-xs text-white/50">{el.props.location}</p></div></div>{children}</div>;
  },
  'clock': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ ...style, fontFamily: 'monospace' }}>12:00:00{children}</div>;
  },
  'timer': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="flex gap-2 justify-center">{[...Array(4)].map((_, i) => <div key={i} className="text-center"><div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-lg font-bold">00</div><p className="text-[8px] text-white/30 mt-0.5">{['Days','Hours','Mins','Secs'][i]}</p></div>)}</div>{children}</div>;
  },
  'qr-code': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="flex justify-center"><div className="w-32 h-32 bg-white rounded flex items-center justify-center"><span className="text-[8px] text-black/40 text-center px-2">{el.props.text || 'QR Content'}</span></div>{children}</div>;
  },
};
