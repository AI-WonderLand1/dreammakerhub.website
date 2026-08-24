import type { BlockRenderer } from './types';

export const blogRenderers: Record<string, BlockRenderer> = {
  'step': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="flex gap-4">{(el.props.steps as any[] || []).map((s: any, i: number) => <div key={i} className="flex-1 text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center mx-auto text-sm font-bold">{i + 1}</div><p className="text-xs font-medium mt-1">{s.title}</p><p className="text-[10px] text-white/40">{s.desc}</p></div>)}</div>{children}</div>;
  },
  'steps': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div className="flex gap-4">{(el.props.steps as any[] || []).map((s: any, i: number) => <div key={i} className="flex-1 text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center mx-auto text-sm font-bold">{i + 1}</div><p className="text-xs font-medium mt-1">{s.title}</p><p className="text-[10px] text-white/40">{s.desc}</p></div>)}</div>{children}</div>;
  },
  'author-box': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}><div className="w-12 h-12 rounded-full bg-white/10 shrink-0" /><div><p className="text-sm font-semibold">{el.props.name}</p><p className="text-[10px] text-white/40">{el.props.role}</p><p className="text-xs text-white/50 mt-1">{el.props.bio}</p></div>{children}</div>;
  },

  'magazine-grid': ({ el, baseProps, style }) => {
    const posts = el.props.posts || [];
    const feat = posts[el.props.featuredIndex || 0] || posts[0] || {};
    const rest = posts.filter((_: any, i: number) => i !== (el.props.featuredIndex || 0));
    return (
      <section {...baseProps} style={style}>
        <article style={{ borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '1.5rem' }}>
          <span style={{ color: '#22d3ee', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em' }}>{feat.tag}</span>
          <h2 style={{ margin: '0.4rem 0' }}>{feat.title}</h2>
          <p style={{ opacity: 0.65 }}>{feat.excerpt}</p>
          <small style={{ opacity: 0.45 }}>{feat.minutes} min read</small>
        </article>
        <aside style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          {rest.map((p: any, i: number) => (
            <div key={i}><strong>{p.title}</strong><div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{p.tag} · {p.minutes} min</div></div>
          ))}
        </aside>
      </section>
    );
  },
  'post-list-rows': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      {(el.props.rows || []).map((r: any, i: number) => (
        <a key={i} href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.7rem 0.5rem', borderRadius: '0.6rem', textDecoration: 'none', color: 'inherit', background: 'rgba(255,255,255,0.02)' }}>
          {el.props.showThumbs !== false && <span style={{ width: 64, height: 44, borderRadius: 6, background: 'rgba(168,85,247,0.15)' }} />}
          <strong style={{ flex: 1 }}>{r.title}</strong>
          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{r.date} · {r.minutes} min</span>
        </a>
      ))}
    </div>
  ),
  'related-posts': ({ el, baseProps, style }) => (
    <section {...baseProps} style={style}>
      <h3>{el.props.heading}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.count || 3}, 1fr)`, gap: '1rem' }}>
        {Array.from({ length: el.props.count || 3 }).map((_, i) => (
          <a key={i} href="#" style={{ borderRadius: '0.6rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', color: 'inherit' }}>
            <span style={{ display: 'block', aspectRatio: '16/10', background: 'rgba(168,85,247,0.12)' }} />
            <span style={{ display: 'block', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>Related article {i + 1}</span>
          </a>
        ))}
      </div>
    </section>
  ),
  'tag-filter-bar': ({ el, baseProps, style }) => (
    <nav {...baseProps} style={style} aria-label="Topics">
      {(el.props.tags || []).map((t: string) => {
        const active = t === el.props.active;
        return <button key={t} type="button" style={{ padding: '0.3rem 0.9rem', borderRadius: 999, whiteSpace: 'nowrap', border: '1px solid ' + (active ? '#a855f7' : 'rgba(255,255,255,0.15)'), background: active ? 'rgba(168,85,247,0.18)' : 'transparent', color: '#fff', cursor: 'pointer' }}>{t}</button>;
      })}
    </nav>
  ),
  'reading-progress': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}><div style={{ height: el.props.thickness || 3, width: '35%', background: el.props.color || '#a855f7', borderRadius: 999 }} /></div>
  ),
  'table-of-contents': ({ el, baseProps, style, children }) => (
    <nav {...baseProps} style={style} aria-label="Table of contents">
      <strong>{el.props.heading}</strong>
      <ol style={{ paddingLeft: '1.1rem', margin: '0.5rem 0 0', lineHeight: 1.9 }}>
        {(el.props.items || []).map((it: string) => <li key={it}><a href={'#' + it.toLowerCase().replace(/\s+/g, '-')} style={{ textDecoration: 'none', opacity: 0.8 }}>{it}</a></li>)}
      </ol>
      {children}
    </nav>
  ),
  'featured-post-hero': ({ el, baseProps, style }) => (
    <a {...baseProps} href={el.props.href || '#'} style={{ ...style, backgroundImage: el.props.image ? `linear-gradient(180deg, transparent, rgba(0,0,0,0.78)), url(${el.props.image})` : undefined, textDecoration: 'none' }}>
      <span style={{ color: '#22d3ee', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.14em' }}>{el.props.category}</span>
      <h2 style={{ margin: '0.4rem 0', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>{el.props.title}</h2>
      <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>{el.props.minutes} min read →</span>
    </a>
  ),
  'post-footer-cta': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <p style={{ marginTop: 0 }}>{el.props.text}</p>
      <a href={el.props.href || '#'} className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 no-underline" style={{ color: '#fff', fontWeight: 700 }}>{el.props.cta}</a>
    </div>
  ),
  'blog-sidebar': ({ el, baseProps, style }) => (
    <aside {...baseProps} style={style}>
      {el.props.showSearch && <input placeholder="Search posts…" aria-label="Search posts" style={{ width: '100%', padding: '0.55rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />}
      <div><strong style={{ fontSize: '0.8rem' }}>Recent</strong>
        {(el.props.recentTitles || []).map((t: string) => <div key={t} style={{ fontSize: '0.82rem', opacity: 0.75, marginTop: 6 }}>· {t}</div>)}
      </div>
    </aside>
  ),

};
