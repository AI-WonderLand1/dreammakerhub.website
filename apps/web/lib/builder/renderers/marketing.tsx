import type { BlockRenderer } from './types';

export const marketingRenderers: Record<string, BlockRenderer> = {
  'hero': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{el.props.title}</h2><p style={{ opacity: 0.7, marginBottom: '1rem' }}>{el.props.subtitle}</p><span className="inline-block rounded bg-purple-600 text-white px-4 py-2 text-sm font-semibold">{el.props.cta || el.props.buttonText}</span>{children}</div>;
  },
  'cta': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{el.props.title}</h2><p style={{ opacity: 0.7, marginBottom: '1rem' }}>{el.props.subtitle}</p><span className="inline-block rounded bg-purple-600 text-white px-4 py-2 text-sm font-semibold">{el.props.cta || el.props.buttonText}</span>{children}</div>;
  },
  'testimonial': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}>{el.props.quote && <p className="italic text-sm mb-2">"{el.props.quote}"</p>}<p className="text-xs text-white/50">— {el.props.author}{el.props.role ? `, ${el.props.role}` : ''}</p>{children}</div>;
  },
  'pricing': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className={el.props.highlighted ? 'ring-2 ring-purple-500' : ''}><p className="text-3xl font-bold">{el.props.price}<span className="text-xs text-white/40">{el.props.interval}</span></p><p className="text-sm font-semibold mt-2">{el.props.plan}</p><ul className="text-[11px] text-white/60 mt-2 space-y-1">{(el.props.features as string[] || []).map((f: string, i: number) => <li key={i}>✓ {f}</li>)}</ul><span className="inline-block mt-3 rounded bg-purple-600 text-white px-3 py-1 text-xs">{el.props.cta}</span>{children}</div>;
  },
  'team-grid': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>{(el.props.members as any[] || []).map((m: any, i: number) => <div key={i} className="text-center p-2"><div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-1" /><p className="text-xs font-medium">{m.name}</p><p className="text-[9px] text-white/40">{m.role}</p></div>)}</div>{children}</div>;
  },
  'logo-cloud': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="flex justify-center gap-6 flex-wrap">{(el.props.logos as string[] || []).map((l: string, i: number) => <span key={i} className="text-sm text-white/40 px-4 py-2 bg-white/5 rounded">{l}</span>)}</div>{children}</div>;
  },
  'alert': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const alertColors: Record<string, string> = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' };
      return <div {...baseProps} style={{ ...style, borderLeftColor: alertColors[el.props.type] || '#3b82f6', borderLeftWidth: '3px' }}><span style={{ fontSize: '0.875rem' }}>{el.props.content}</span>{children}</div>;
  },
  'stats-section': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>{(el.props.stats as any[] || []).map((s: any, i: number) => <div key={i} className="text-center"><p className="text-2xl font-bold text-purple-400">{s.number}</p><p className="text-xs text-white/50">{s.label}</p></div>)}</div>{children}</div>;
  },
  'count-up': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><p className="text-3xl font-bold text-purple-400">{el.props.number}{el.props.suffix}</p><p className="text-sm text-white/50">{el.props.label}</p>{children}</div>;
  },
  'progress': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const pct = Math.min(100, Math.max(0, Number(el.props.value) || 0));
      return <div {...baseProps}><div className="flex items-center justify-between text-xs text-white/50 mb-1"><span>{el.props.label}</span><span>{pct}%</span></div><div className="w-full h-2 rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: el.props.color || '#7c3aed' }} /></div>{children}</div>;
  },
  'chart': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const chartData = (el.props.data as number[] || []);
      const chartLabels = (el.props.labels as string[] || []);
      return <div {...baseProps}><p className="text-xs font-semibold text-white/70 mb-2">{el.props.title}</p><div className="flex items-end gap-2 h-24">{(el.props.type === 'bar' ? chartData : chartData.slice(0, 5)).map((v: number, i: number) => <div key={i} className="flex-1 flex flex-col items-center"><div className="w-full rounded-t bg-purple-500/60" style={{ height: `${Math.max(8, (v / Math.max(...chartData)) * 80)}px` }} /><span className="text-[8px] text-white/30 mt-0.5">{chartLabels[i] || ''}</span></div>)}</div>{children}</div>;
  },
  'feature-grid': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '1.5rem' }}>{(el.props.features as any[] || []).map((f: any, i: number) => <div key={i} className="text-center"><span className="text-2xl">{f.icon}</span><p className="text-sm font-semibold mt-1">{f.title}</p><p className="text-[10px] text-white/40 mt-0.5">{f.desc}</p></div>)}</div>{children}</div>;
  },
};
