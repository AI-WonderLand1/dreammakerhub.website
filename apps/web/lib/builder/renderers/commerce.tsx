import type { BlockRenderer } from './types';

export const commerceRenderers: Record<string, BlockRenderer> = {
  'product-card': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="w-full h-32 bg-white/5 rounded mb-2" /><p className="text-sm font-semibold">{el.props.name}</p><p className="text-lg font-bold text-purple-400">{el.props.price}</p>{children}</div>;
  },
  'product-grid': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '1rem' }}>{Array.from({ length: el.props.count || 6 }).map((_, i) => <div key={i} className="bg-white/5 rounded p-3"><div className="w-full h-20 bg-white/5 rounded mb-1" /><div className="h-3 w-2/3 bg-white/10 rounded mb-1" /><div className="h-3 w-1/3 bg-purple-500/30 rounded" /></div>)}{children}</div>;
  },
  'add-to-cart': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <button {...baseProps} className="rounded bg-purple-600 text-white px-4 py-2 text-sm font-semibold">{el.props.label || 'Add to Cart'}{children}</button>;
  },
  'order-summary': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="space-y-1">{(el.props.items as any[] || []).map((item: any, i: number) => <div key={i} className="flex justify-between text-xs text-white/60"><span>{item.name} x{item.qty}</span><span>{item.price}</span></div>)}</div><div className="border-t border-white/10 mt-2 pt-2 flex justify-between text-sm font-bold"><span>Total</span><span className="text-purple-400">{el.props.total}</span></div>{children}</div>;
  },
  'wishlist': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <button {...baseProps} className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs text-pink-400">♡ {el.props.label}{children}</button>;
  },
  'coupon': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="flex gap-2"><input type="text" placeholder={el.props.placeholder} className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs" /><button className="rounded bg-purple-600 text-white px-2 text-xs">{el.props.buttonText}</button>{children}</div>;
  },
  'size-selector': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="flex gap-1">{(el.props.sizes as string[] || []).map((s: string, i: number) => <span key={i} className={`px-2 py-1 rounded text-xs border ${s === el.props.selected ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 text-white/50'}`}>{s}</span>)}{children}</div>;
  },
  'color-swatches': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="flex gap-1">{(el.props.colors as any[] || []).map((c: any, i: number) => <div key={i} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: c.value, borderColor: c.value === el.props.selected ? '#7c3aed' : 'rgba(255,255,255,0.2)' }} />)}{children}</div>;
  },
};
