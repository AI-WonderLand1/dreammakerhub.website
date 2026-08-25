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
  'product-grid-3': ({ el, baseProps, style }) => (
    <section {...baseProps} style={style}>
      <h3>{el.props.heading}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {(el.props.products || []).map((p: any, i: number) => (
          <div key={i} style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: '0.8rem', overflow: 'hidden' }}>
            <span style={{ position: 'relative', display: 'block', aspectRatio: '1', background: p.image ? `url(${p.image}) center/cover` : 'rgba(255,255,255,0.05)' }}>
              {el.props.showBadge && p.badge && <span style={{ position: 'absolute', top: 8, left: 8, background: '#ec4899', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '2px 10px' }}>{p.badge}</span>}
            </span>
            <div style={{ padding: '0.7rem', display: 'flex', justifyContent: 'space-between' }}><strong style={{ fontSize: '0.85rem' }}>{p.name}</strong><span style={{ fontWeight: 700 }}>{p.price}</span></div>
          </div>
        ))}
      </div>
    </section>
  ),
  'collection-banner': ({ el, baseProps, style }) => (
    <section {...baseProps} style={{ ...style, backgroundImage: el.props.image ? `url(${el.props.image})` : 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.15))' }}>
      <h2 style={{ margin: 0 }}>{el.props.title}</h2>
      <p style={{ opacity: 0.85, marginTop: 4 }}>{el.props.subtitle}</p>
      <a href={el.props.href || '#'} className="inline-block mt-3 px-5 py-2.5 rounded-xl bg-white no-underline" style={{ color: '#111', fontWeight: 800, width: 'fit-content' }}>{el.props.cta}</a>
    </section>
  ),
  'variant-picker': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <span style={{ fontSize: '0.78rem', opacity: 0.65, marginRight: 4 }}>{el.props.label}:</span>
      {(el.props.options || []).map((o: string, i: number) => {
        const active = i === (el.props.active ?? -1);
        return <button key={o} type="button" aria-pressed={active} style={{ minWidth: 38, padding: '0.35rem 0.55rem', borderRadius: 8, cursor: 'pointer', border: `1px solid ${active ? '#a855f7' : 'rgba(255,255,255,0.2)'}`, background: active ? 'rgba(168,85,247,0.2)' : 'transparent', color: '#fff', fontWeight: active ? 700 : 400 }}>{o}</button>;
      })}
    </div>
  ),
  'stock-badge': ({ el, baseProps, style }) => {
    const s = el.props.stock ?? 0;
    const low = s > 0 && s <= (el.props.lowThreshold ?? 5);
    const text = s === 0 ? el.props.outText : low ? (el.props.lowText || '').replace('{n}', String(s)) : el.props.inStockText;
    return (
      <span {...baseProps} style={{ ...style, background: s === 0 ? 'rgba(239,68,68,0.15)' : low ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.13)', color: s === 0 ? '#f87171' : low ? '#fbbf24' : '#4ade80' }}>
        ● {text}
      </span>
    );
  },
  'bundle-builder': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={style}>
      <strong>🎯 {el.props.pickLabel}</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.8rem 0' }}>
        {(el.props.items || []).map((it: string) => (
          <button key={it} type="button" style={{ padding: '0.45rem 0.9rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>+ {it}</button>
        ))}
      </div>
      <small style={{ opacity: 0.6 }}>Discount applied at checkout · {el.props.discountPct}% off</small>
      {children}
    </div>
  ),
  'subscription-product': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      {(el.props.plans || []).map((pl: any, i: number) => {
        const active = i === (el.props.active ?? 0);
        return (
          <label key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.1rem', borderRadius: '0.7rem', cursor: 'pointer', border: `2px solid ${active ? '#ec4899' : 'rgba(255,255,255,0.12)'}`, background: active ? 'rgba(236,72,153,0.07)' : 'transparent' }}>
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><input type="radio" name="sub-plan" defaultChecked={active} /> <strong>{pl.label}</strong></span>
            <span><strong>{pl.price}</strong> {pl.note && <em style={{ fontSize: '0.7rem', color: '#4ade80', marginLeft: 6 }}>{pl.note}</em>}</span>
          </label>
        );
      })}
    </div>
  ),
  'gift-card': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <h3 style={{ margin: '0 0 0.8rem' }}>💳 Gift Card</h3>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        {(el.props.amounts || []).map((a: number) => (
          <button key={a} type="button" style={{ padding: '0.7rem 1.3rem', borderRadius: 10, border: '2px solid rgba(236,72,153,0.5)', background: 'transparent', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>{el.props.currency}{a}</button>
        ))}
      </div>
      <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>{el.props.note}</p>
      <button style={{ padding: '0.6rem 1.4rem', borderRadius: 8, border: 0, background: '#ec4899', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{el.props.cta}</button>
    </div>
  ),
  'recently-viewed': ({ el, baseProps, style }) => (
    <section {...baseProps} style={style}>
      <h4 style={{ margin: '0 0 0.6rem', opacity: 0.8 }}>{el.props.heading}</h4>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {Array.from({ length: el.props.count || 4 }).map((_, i) => (
          <span key={i} style={{ flexShrink: 0, width: 96 }}><span style={{ display: 'block', aspectRatio: '1', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.06)' }} /><small style={{ opacity: 0.55 }}>Item {i + 1}</small></span>
        ))}
      </div>
    </section>
  ),
};
