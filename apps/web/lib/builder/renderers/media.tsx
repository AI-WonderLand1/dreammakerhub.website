import type { BlockRenderer } from './types';
import {
  sanitizeBuilderSvg,
  sanitizeEmbedUrl,
  sanitizeYouTubeVideoId,
} from '@/lib/security/sanitize-html.client';

const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-presentation';

export const mediaRenderers: Record<string, BlockRenderer> = {
  'video': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const safeSrc = sanitizeEmbedUrl(el.props.src);
      return (
        <div {...baseProps}>
          {safeSrc ? (
            <iframe
              src={safeSrc}
              title={el.props.title || el.props.caption || 'Embedded video'}
              sandbox={EMBED_SANDBOX}
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ width: '100%', height: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 'inherit' }}
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded border border-amber-500/20 bg-amber-500/5 px-4 text-center text-xs text-amber-200/70">
              Video embeds must use a trusted HTTPS provider.
            </div>
          )}
          {el.props.caption && <p className="text-xs text-white/50 mt-1 text-center">{el.props.caption}</p>}
          {children}
        </div>
      );
  },
  'cover': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return (
        <div {...baseProps} style={{ ...style, backgroundImage: `url(${el.props.src})`, position: 'relative' }}>
          {el.props.overlay && <div style={{ position: 'absolute', inset: 0, backgroundColor: el.props.overlay, borderRadius: style.borderRadius }} />}
          <div style={{ position: 'relative', zIndex: 1 }}>{el.props.content}{children}</div>
        </div>
      );
  },
  'media-text': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return (
        <div {...baseProps} style={{ ...style, gridTemplateColumns: el.props.mediaPosition === 'right' ? '1fr 1fr' : '1fr 1fr' }}>
          <img src={el.props.mediaSrc} alt="" style={{ width: '100%', borderRadius: '0.5rem' }} />
          <div>{el.props.content}</div>
          {children}
        </div>
      );
  },
  'gallery': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '0.75rem' }}>{(el.props.images as string[] || []).map((src: string, i: number) => <div key={i} className="aspect-video bg-white/5 rounded overflow-hidden"><img src={src} alt="" className="w-full h-full object-cover" /></div>)}</div>{children}</div>;
  },
  'video-bg': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ position: 'relative', overflow: 'hidden' }}><div className="absolute inset-0 bg-black/40" /><div className="relative z-10 p-8 text-center text-white"><p className="text-lg font-bold">Video Background</p></div>{children}</div>;
  },
  'image-carousel': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="relative"><div className="aspect-video bg-white/5 rounded flex items-center justify-center"><span className="text-4xl">🖼️</span></div><div className="flex justify-center gap-1 mt-2">{((el.props.images || []) as string[]).map((_: any, i: number) => <div key={i} className="w-2 h-2 rounded-full bg-white/30" />)}</div>{children}</div>;
  },
  'image-compare': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="relative aspect-video bg-white/5 rounded overflow-hidden"><div className="absolute inset-0 flex"><div className="flex-1" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} /><div className="flex-1" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} /></div><div className="absolute inset-y-0 left-1/2 w-0.5 bg-white shadow-lg" /><span className="absolute top-2 left-2 text-[9px] text-white/80 bg-black/50 px-1 rounded">Before</span><span className="absolute top-2 right-2 text-[9px] text-white/80 bg-black/50 px-1 rounded">After</span>{children}</div>;
  },
  'ai-image': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/30 bg-purple-500/5 p-3 text-center"><span className="text-3xl">🎨</span><p className="text-xs text-purple-400 mt-1">AI: {el.props.prompt?.slice(0, 40)}</p>{children}</div>;
  },
  'lottie': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="flex items-center justify-center"><span className="text-4xl">🎞️</span>{children}</div>;
  },
  'svg': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const safeSvg = sanitizeBuilderSvg(el.props.svg || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/></svg>');
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: safeSvg }} />;
  },

  'masonry-gallery': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>{(el.props.images || []).map((s: string, i: number) => (
      <img key={i} src={s} alt="" loading="lazy" style={{ width: '100%', marginBottom: el.props.gap || '0.6rem', borderRadius: el.props.rounded ? '0.5rem' : 0, breakInside: 'avoid', display: 'block' }} />
    ))}</div>
  ),
  'lightbox-gallery': ({ el, baseProps, style }) => (
    <div {...baseProps} style={{ ...style, gridTemplateColumns: `repeat(${el.props.columns || 4}, 1fr)` }}>
      {(el.props.thumbs || []).map((t: string, i: number) => <img key={i} src={t} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '0.4rem', cursor: 'zoom-in' }} />)}
    </div>
  ),
  'video-hero': ({ el, baseProps, style }) => (
    <section {...baseProps} style={{ ...style, backgroundImage: el.props.poster ? `url(${el.props.poster})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${(el.props.overlayOpacity ?? 45) / 100})` }} />
      <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', margin: 0 }}>{el.props.headline}</h2>
        {el.props.cta && <a href={el.props.href || '#'} className="inline-block mt-4 px-6 py-3 rounded-xl bg-white no-underline" style={{ color: '#111', fontWeight: 800 }}>{el.props.cta}</a>}
      </div>
    </section>
  ),
  'youtube-lite': ({ el, baseProps, style }) => {
    const videoId = sanitizeYouTubeVideoId(el.props.videoId);
    if (!videoId) {
      return (
        <div {...baseProps} style={style} className="flex aspect-video items-center justify-center rounded border border-amber-500/20 bg-amber-500/5 px-4 text-center text-xs text-amber-200/70">
          Invalid YouTube video ID.
        </div>
      );
    }
    return (
      <iframe
        {...baseProps}
        style={style}
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={el.props.title || 'YouTube video'}
        sandbox={EMBED_SANDBOX}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    );
  },
  'before-after': ({ el, baseProps, style }) => (
    <figure {...baseProps} style={{ ...style, backgroundImage: el.props.beforeSrc ? `url(${el.props.beforeSrc})` : undefined, backgroundSize: 'cover' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: el.props.afterSrc ? `url(${el.props.afterSrc})` : undefined, backgroundSize: 'cover', clipPath: `inset(0 0 0 ${el.props.startPercent ?? 50}%)` }} />
      <span style={{ position: 'absolute', left: 10, bottom: 10, fontSize: 11, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>{el.props.beforeLabel}</span>
      <span style={{ position: 'absolute', right: 10, bottom: 10, fontSize: 11, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>{el.props.afterLabel}</span>
      <input type="range" min={0} max={100} defaultValue={el.props.startPercent ?? 50} aria-label="Compare slider" style={{ position: 'absolute', bottom: 4, left: '10%', width: '80%' }} />
    </figure>
  ),
  'avatar-stack': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      {(el.props.avatars || []).map((a: string, i: number) => (
        <img key={i} src={a} alt="" style={{ width: el.props.size || 40, height: el.props.size || 40, borderRadius: '50%', objectFit: 'cover', marginLeft: i ? -(el.props.overlap || 12) : 0, border: '2px solid rgba(255,255,255,0.35)' }} />
      ))}
      {el.props.extraCount && <span style={{ marginLeft: 6, fontWeight: 800, opacity: 0.7 }}>{el.props.extraCount}</span>}
    </div>
  ),
  'gif-grid': ({ el, baseProps, style }) => (
    <div {...baseProps} style={{ ...style, gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)` }}>
      {(el.props.gifs || []).map((g: string, i: number) => <img key={i} src={g} alt="" loading="lazy" style={{ width: '100%', borderRadius: '0.4rem' }} />)}
    </div>
  ),
  'screenshot-frame': ({ el, baseProps, style }) => (
    <figure {...baseProps} style={style} >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.06)' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, background: 'rgba(0,0,0,0.35)', borderRadius: 999, padding: '2px 10px', opacity: 0.8 }}>{el.props.url}</span>
      </div>
      {el.props.src && <img src={el.props.src} alt="Screenshot" loading="lazy" style={{ width: '100%', display: 'block' }} />}
    </figure>
  ),
  'audio-player-card': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <div style={{ width: 56, height: 56, borderRadius: '0.6rem', background: el.props.cover ? `url(${el.props.cover}) center/cover` : 'rgba(168,85,247,0.25)' }} />
      <div style={{ flex: 1 }}>
        <strong>{el.props.title}</strong>
        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{el.props.artist} · {el.props.duration}</div>
      </div>
      <button type="button" aria-label="Play" style={{ width: 42, height: 42, borderRadius: '50%', border: 0, background: '#22d3ee', color: '#083344', fontSize: '1rem', cursor: 'pointer' }}>▶</button>
    </div>
  ),

};
