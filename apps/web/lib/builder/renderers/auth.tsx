import type { BlockRenderer } from './types';

export const authRenderers: Record<string, BlockRenderer> = {
  'login-form': ({ el, selectedId, selectElement, baseProps, children }) => {

  },
  'register-form': ({ el, selectedId, selectElement, baseProps, children }) => {

  },
  'password-reset': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} className="max-w-xs mx-auto"><p className="text-sm font-semibold mb-2">{el.props.title}</p><div className="space-y-2"><div className="h-7 rounded border border-white/10 bg-black/40" /><div className="h-7 rounded border border-white/10 bg-black/40" /></div><div className="mt-2 rounded bg-purple-600 text-white text-center py-1 text-xs font-semibold">{el.props.submitText}</div>{children}</div>;
  },
  'oauth-buttons': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} className="space-y-1">{(el.props.providers as string[] || []).map((p: string, i: number) => <div key={i} className="flex items-center gap-2 rounded border border-white/10 px-2 py-1 text-xs text-white/60"><span>{['🔵', '🐙', '🔵'][i] || '🔗'}</span><span className="capitalize">{p}</span></div>)}{children}</div>;
  },
};
