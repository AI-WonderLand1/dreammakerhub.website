import type { BlockRenderer } from './types';

export const socialRenderers: Record<string, BlockRenderer> = {
  'whatsapp-share': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="inline-flex items-center gap-1 rounded bg-[#25D366] text-white px-2 py-1 text-xs font-semibold">📱 {el.props.text || 'Share'}{children}</div>;
  },
  'telegram-share': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="inline-flex items-center gap-1 rounded bg-[#0088cc] text-white px-2 py-1 text-xs font-semibold">✈️ {el.props.text || 'Share'}{children}</div>;
  },
  'youtube-sub': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold">▶ {el.props.channelName}{children}</div>;
  },
  'discord-invite': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="flex items-center gap-2 px-3 py-2 rounded bg-[#5865F2]/20 border border-[#5865F2]/30 text-xs"><span className="text-lg">💬</span><span className="font-semibold">{el.props.serverName}</span>{children}</div>;
  },
  'github-star': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs">⭐ {el.props.repo}{children}</div>;
  },
  'facebook-page': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-white/10 p-3 text-xs text-center text-white/50">📘 {el.props.pageUrl || 'Facebook Page'}{children}</div>;
  },
  'twitter-timeline': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-white/10 p-3 text-xs text-center text-white/50">🐦 @{el.props.username || 'username'}{children}</div>;
  },
};
