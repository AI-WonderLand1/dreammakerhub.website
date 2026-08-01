import type { BlockRenderer } from './types';

export const mediaRenderers: Record<string, BlockRenderer> = {
  'video': ({ el, selectedId, selectElement, baseProps, children }) => {
      return (
        <div {...baseProps}>
          <iframe src={el.props.src} style={{ width: '100%', height: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 'inherit' }} allowFullScreen />
          {el.props.caption && <p className="text-xs text-white/50 mt-1 text-center">{el.props.caption}</p>}
          {children}
        </div>
      );
  },
  'cover': ({ el, selectedId, selectElement, baseProps, children }) => {
      return (
        <div {...baseProps} style={{ ...style, backgroundImage: `url(${el.props.src})`, position: 'relative' }}>
          {el.props.overlay && <div style={{ position: 'absolute', inset: 0, backgroundColor: el.props.overlay, borderRadius: style.borderRadius }} />}
          <div style={{ position: 'relative', zIndex: 1 }}>{el.props.content}{children}</div>
        </div>
      );
  },
  'media-text': ({ el, selectedId, selectElement, baseProps, children }) => {
      return (
        <div {...baseProps} style={{ ...style, gridTemplateColumns: el.props.mediaPosition === 'right' ? '1fr 1fr' : '1fr 1fr' }}>
          <img src={el.props.mediaSrc} alt="" style={{ width: '100%', borderRadius: '0.5rem' }} />
          <div>{el.props.content}</div>
          {children}
        </div>
      );
  },
  'gallery': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps}><div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.props.columns || 3}, 1fr)`, gap: '0.75rem' }}>{(el.props.images as string[] || []).map((src: string, i: number) => <div key={i} className="aspect-video bg-white/5 rounded overflow-hidden"><img src={src} alt="" className="w-full h-full object-cover" /></div>)}</div>{children}</div>;
  },
  'video-bg': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} style={{ position: 'relative', overflow: 'hidden' }}><div className="absolute inset-0 bg-black/40" /><div className="relative z-10 p-8 text-center text-white"><p className="text-lg font-bold">Video Background</p></div>{children}</div>;
  },
  'image-carousel': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} className="relative"><div className="aspect-video bg-white/5 rounded flex items-center justify-center"><span className="text-4xl">🖼️</span></div><div className="flex justify-center gap-1 mt-2">{((el.props.images || []) as string[]).map((_: any, i: number) => <div key={i} className="w-2 h-2 rounded-full bg-white/30" />)}</div>{children}</div>;
  },
  'image-compare': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} className="relative aspect-video bg-white/5 rounded overflow-hidden"><div className="absolute inset-0 flex"><div className="flex-1" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} /><div className="flex-1" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} /></div><div className="absolute inset-y-0 left-1/2 w-0.5 bg-white shadow-lg" /><span className="absolute top-2 left-2 text-[9px] text-white/80 bg-black/50 px-1 rounded">Before</span><span className="absolute top-2 right-2 text-[9px] text-white/80 bg-black/50 px-1 rounded">After</span>{children}</div>;
  },
  'ai-image': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} className="rounded border border-purple-500/30 bg-purple-500/5 p-3 text-center"><span className="text-3xl">🎨</span><p className="text-xs text-purple-400 mt-1">AI: {el.props.prompt?.slice(0, 40)}</p>{children}</div>;
  },
  'lottie': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} className="flex items-center justify-center"><span className="text-4xl">🎞️</span>{children}</div>;
  },
  'svg': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: el.props.svg || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/></svg>' }} />;
  },
};
