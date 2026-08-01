import type { BlockRenderer } from './types';

export const notificationRenderers: Record<string, BlockRenderer> = {
  'toast': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="text-center text-xs font-medium px-3 py-1.5">{el.props.message || el.props.text}{children}</div>;
  },
  'banner': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="text-center text-xs font-medium px-3 py-1.5">{el.props.message || el.props.text}{children}</div>;
  },
  'announcement-bar': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="text-center text-xs font-medium px-3 py-1.5">{el.props.message || el.props.text}{children}</div>;
  },
  'push-notification': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="rounded border border-white/10 p-3 text-center"><p className="text-sm font-semibold">{el.props.title}</p><p className="text-xs text-white/50 mt-1">{el.props.message}</p><div className="flex gap-2 justify-center mt-2"><span className="rounded bg-purple-600 px-2 py-0.5 text-[10px]">{el.props.acceptText}</span><span className="rounded bg-white/10 px-2 py-0.5 text-[10px]">{el.props.declineText}</span></div>{children}</div>;
  },
  'live-alert': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} className="text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />{el.props.message}{children}</div>;
  },
};
