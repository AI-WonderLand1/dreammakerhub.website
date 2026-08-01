import type { BlockRenderer } from './types';

export const productsRenderers: Record<string, BlockRenderer> = {
  'product-page': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}><div className="bg-white/5 rounded aspect-square" /><div><p className="text-xl font-bold">{el.props.name}</p><p className="text-2xl font-bold text-purple-400 mt-1">{el.props.price}</p><p className="text-xs text-white/50 mt-2">{el.props.description}</p></div>{children}</div>;
  },
  'product-filter': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="flex gap-2">{(el.props.sortOptions as string[] || []).map((o: string, i: number) => <span key={i} className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/40">{o}</span>)}</div>{children}</div>;
  },
  'product-badge': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <span {...baseProps} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.625rem', fontWeight: 700 }}>{el.props.text}{children}</span>;
  },
  'stock-indicator': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const stockStatus = el.props.status || 'in-stock';
      return <div {...baseProps}><span className={`inline-block w-2 h-2 rounded-full mr-1 ${stockStatus === 'in-stock' ? 'bg-green-400' : stockStatus === 'out-of-stock' ? 'bg-red-400' : 'bg-yellow-400'}`} /><span className="text-xs">{stockStatus === 'in-stock' ? `In Stock (${el.props.quantity || 0})` : stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Pre-order'}</span>{children}</div>;
  },
};
