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
  'cart-drawer': ({ el, baseProps, style, children }) => (
    <aside {...baseProps} style={style} aria-label="Shopping cart">
      <strong>{el.props.title}</strong>
      {(el.props.items || []).length === 0 ? <p style={{ opacity: 0.55 }}>{el.props.emptyText}</p> : (el.props.items || []).map((it: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>{it.name} ×{it.qty}</span><span>{it.price}</span></div>
      ))}
      <button style={{ marginTop: 'auto', padding: '0.65rem', borderRadius: 8, border: 0, background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{el.props.checkoutLabel}</button>
      {children}
    </aside>
  ),
  'cart-icon-button': ({ el, baseProps, style }) => (
    <button {...baseProps} style={style} aria-label={`Cart, ${el.props.count} items`}>
      🛍️
      {(el.props.count ?? 0) > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#ec4899', color: '#fff', borderRadius: '50%', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, display: 'grid', placeItems: 'center' }}>{el.props.count}</span>}
    </button>
  ),
  'express-checkout': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      {el.props.showApplePay && <button style={{ padding: '0.6rem', borderRadius: 8, border: 0, background: '#000', color: '#fff', fontWeight: 700, cursor: 'pointer' }}> Pay</button>}
      {el.props.showGooglePay && <button style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: '#fff', color: '#111', fontWeight: 700, cursor: 'pointer' }}>G Pay</button>}
      {el.props.showPaypal && <button style={{ padding: '0.6rem', borderRadius: 8, border: 0, background: '#ffc439', color: '#003087', fontWeight: 800, fontStyle: 'italic', cursor: 'pointer' }}>PayPal</button>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.45, fontSize: '0.7rem' }}><span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />{el.props.dividerLabel}<span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} /></div>
    </div>
  ),
  'order-tracker': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <strong>Order {el.props.orderNo}</strong> <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>via {el.props.carrier}</span>
      <div style={{ display: 'flex', marginTop: '0.9rem' }}>
        {(el.props.steps || []).map((s: string, i: number) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ margin: '0 auto 6px', width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, background: i <= (el.props.currentStep ?? 0) ? '#22c55e' : 'rgba(255,255,255,0.1)', color: i <= (el.props.currentStep ?? 0) ? '#052e16' : 'rgba(255,255,255,0.4)' }}>{i <= (el.props.currentStep ?? 0) ? '✓' : i + 1}</div>
            <small style={{ opacity: i <= (el.props.currentStep ?? 0) ? 0.85 : 0.4 }}>{s}</small>
          </div>
        ))}
      </div>
    </div>
  ),
  'wishlist-grid': ({ el, baseProps, style }) => (
    <section {...baseProps} style={style}>
      <h3>{el.props.heading}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: '0.7rem', overflow: 'hidden' }}>
            <span style={{ display: 'block', aspectRatio: '1', background: 'rgba(168,85,247,0.12)' }} />
            <div style={{ padding: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Saved item {i}</span>
              <button style={{ fontSize: '0.68rem', padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>{el.props.moveLabel}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  ),
  'reviews-summary': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={style}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900 }}>{el.props.average}</div>
        <div style={{ color: '#facc15' }}>{'★'.repeat(Math.round(el.props.average))}{('☆').repeat(5 - Math.round(el.props.average))}</div>
        <small style={{ opacity: 0.5 }}>{el.props.total} reviews</small>
      </div>
      <div style={{ flex: 1 }}>
        {(el.props.bars || []).map((b: any) => (
          <div key={b.stars} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem' }}>
            <span style={{ width: 26 }}>{b.stars}★</span>
            <span style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${b.pct}%`, background: '#facc15' }} /></span>
            <span style={{ width: 30, textAlign: 'right', opacity: 0.5 }}>{b.pct}%</span>
          </div>
        ))}
      </div>
      {children}
    </div>
  ),
  'review-card': ({ el, baseProps, style }) => (
    <article {...baseProps} style={style}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ width: 36, height: 36, borderRadius: '50%', background: el.props.avatar ? `url(${el.props.avatar}) center/cover` : 'rgba(236,72,153,0.25)' }} />
        <strong>{el.props.name}</strong>
        {el.props.verified && <span style={{ fontSize: '0.62rem', background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>VERIFIED</span>}
        <span style={{ marginLeft: 'auto', opacity: 0.45, fontSize: '0.72rem' }}>{el.props.date}</span>
      </header>
      <div style={{ color: '#facc15', margin: '0.4rem 0' }}>{'★'.repeat(el.props.rating || 5)}</div>
      <strong style={{ fontSize: '0.9rem' }}>{el.props.title}</strong>
      <p style={{ opacity: 0.75, margin: '0.3rem 0 0' }}>{el.props.body}</p>
    </article>
  ),
  'trust-badges-row': ({ el, baseProps, style }) => (
    <ul {...baseProps} style={{ ...style, listStyle: 'none', margin: 0 }}>
      {(el.props.badges || []).map((b: any, i: number) => (
        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', opacity: 0.8 }}><span>{b.icon}</span>{b.text}</li>
      ))}
    </ul>
  ),
};
