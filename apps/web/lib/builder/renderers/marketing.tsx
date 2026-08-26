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

  'testimonial-grid': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={style}>
      <h3 style={{ textAlign: 'center', marginBottom: '1.25rem' }}>{el.props.heading}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '1.25rem' }}>
        {(el.props.items || []).map((t: any, i: number) => (
          <figure key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
            {el.props.showRating !== false && <div aria-label={`${t.rating} stars`}>{'★'.repeat(t.rating || 5)}</div>}
            <blockquote style={{ margin: '0.5rem 0' }}>“{t.quote}”</blockquote>
            <figcaption style={{ opacity: 0.6, fontSize: '0.8rem' }}>— {t.name}{t.role ? `, ${t.role}` : ''}</figcaption>
          </figure>
        ))}
      </div>
      {children}
    </div>
  ),
  'testimonial-marquee': ({ el, baseProps, style }) => (
    <div {...baseProps} style={{ ...style, display: 'flex', gap: '2rem', animation: `marquee ${el.props.speed || 30}s linear infinite` }}>
      {(el.props.quotes || []).concat(el.props.quotes || []).map((q: string, i: number) => (
        <span key={i} style={{ padding: '0.5rem 1.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', whiteSpace: 'nowrap' }}>{q}</span>
      ))}
    </div>
  ),
  'video-testimonial': ({ el, baseProps, style }) => (
    <figure {...baseProps} style={style}>
      <div style={{ aspectRatio: '16/9', background: el.props.poster ? `url(${el.props.poster}) center/cover` : '#111', borderRadius: '0.5rem', display: 'grid', placeItems: 'center', color: '#fff', cursor: el.props.videoUrl ? 'pointer' : 'default' }}>
        <span style={{ fontSize: '2rem' }}>▶</span>
      </div>
      <figcaption style={{ padding: '0.75rem 0.25rem', fontSize: '0.85rem', opacity: 0.8 }}>{el.props.caption} — <strong>{el.props.name}</strong>, {el.props.company}</figcaption>
    </figure>
  ),
  'countdown-timer': ({ el, baseProps, style }) => {
    const target = new Date(el.props.targetDate || Date.now() + 86400000).getTime();
    const diff = Math.max(0, target - Date.now());
    const parts = { days: Math.floor(diff / 86400000), hours: Math.floor(diff / 3600000) % 24, minutes: Math.floor(diff / 60000) % 60, seconds: Math.floor(diff / 1000) % 60 };
    const box = (v: number, l: string) => (
      <div key={l} style={el.props.style === 'plain' ? {} : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '1.4rem', fontVariantNumeric: 'tabular-nums' }}>{String(v).padStart(2, '0')}</div>
        <div style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase' }}>{l}</div>
      </div>
    );
    return <div {...baseProps} style={style}>{Object.entries(parts).map(([k, v]) => box(v as number, (el.props.labels || {})[k as keyof typeof parts] || k))}</div>;
  },
  'faq-accordion': ({ el, baseProps, style, children }) => (
    <section {...baseProps} style={style}>
      <h3 style={{ textAlign: 'center', marginBottom: '1.25rem' }}>{el.props.heading}</h3>
      {(el.props.items || []).map((item: any, i: number) => (
        <details key={i} open={i === (el.props.defaultOpen ?? -1)} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 0.25rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{item.q}</summary>
          <p style={{ opacity: 0.75, marginTop: '0.5rem' }}>{item.a}</p>
        </details>
      ))}
      {children}
    </section>
  ),
  'comparison-table': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={{ ...style, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Feature', ...(el.props.columns || [])].map((c: string, i: number) => (
          <th key={i} style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.15)', background: i === (el.props.highlightColumn ?? -1) + 1 && i > 0 ? 'rgba(139,92,246,0.12)' : 'transparent' }}>{c}</th>
        ))}</tr></thead>
        <tbody>{(el.props.rows || []).map((r: any, ri: number) => (
          <tr key={ri}>{[r.feature, ...r.values].map((v: any, ci: number) => (
            <td key={ci} style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{typeof v === 'boolean' ? (v ? '✓' : '—') : v}</td>
          ))}</tr>
        ))}</tbody>
      </table>
      {children}
    </div>
  ),
  'partner-banner': ({ el, baseProps, style }) => (
    <a {...baseProps} href={el.props.href || '#'} style={{ ...style, textDecoration: 'none' }}>
      {el.props.logo && <img src={el.props.logo} alt="" style={{ height: '24px' }} />}
      <span>{el.props.text}</span>
    </a>
  ),
  'event-promo': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <h3 style={{ margin: 0 }}>{el.props.title}</h3>
      <p style={{ opacity: 0.7, margin: '0.35rem 0' }}>📅 {el.props.date} · 📍 {el.props.location}</p>
      <a href={el.props.href || '#'} className="inline-block rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold no-underline" style={{ color: '#06202a' }}>{el.props.cta}</a>
    </div>
  ),
  'webinar-promo': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={style}>
      <div>
        <strong>{el.props.title}</strong> <span style={{ opacity: 0.6 }}>{el.props.host}</span>
        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>🗓 {el.props.datetime} · {el.props.seats}</div>
      </div>
      <a href="#" className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold no-underline" style={{ color: '#052e1c' }}>{el.props.cta}</a>
      {children}
    </div>
  ),
  'app-download': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <strong>{el.props.heading}</strong>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <a href={el.props.appStore || '#'} className="rounded-lg bg-black px-4 py-2 text-xs font-bold no-underline" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>🍎 App Store</a>
        <a href={el.props.playStore || '#'} className="rounded-lg bg-black px-4 py-2 text-xs font-bold no-underline" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>▶ Google Play</a>
      </div>
    </div>
  ),
  'referral-banner': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={style}>
      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{el.props.headline}</div>
      <p style={{ opacity: 0.7, margin: '0.35rem 0 0.75rem' }}>{el.props.sub}</p>
      {el.props.code && <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0.35rem 0.9rem', borderRadius: '0.4rem', letterSpacing: '0.08em' }}>{el.props.code}</code>}
      {children}
    </div>
  ),
  'seasonal-sale': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <span style={{ display: 'inline-block', background: '#ef4444', color: '#fff', borderRadius: '999px', padding: '0.2rem 0.85rem', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em' }}>{el.props.badge}</span>
      <h3 style={{ fontSize: '1.6rem', margin: '0.6rem 0 0.2rem' }}>{el.props.headline}</h3>
      <p style={{ opacity: 0.7, marginTop: 0 }}>{el.props.ends}</p>
      <a href={el.props.href || '#'} className="inline-block mt-3 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-bold no-underline" style={{ color: '#fff' }}>{el.props.cta}</a>
    </div>
  ),
  'announcement-bar': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <span>{el.props.text}</span>
      {el.props.linkLabel && <a href={el.props.href || '#'} style={{ textDecoration: 'underline', fontWeight: 700 }}>{el.props.linkLabel} →</a>}
    </div>
  ),
};
