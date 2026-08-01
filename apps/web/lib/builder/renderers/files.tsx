import type { BlockRenderer } from './types';

export const filesRenderers: Record<string, BlockRenderer> = {
  'download-button': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <a {...baseProps} className="inline-flex items-center gap-2 rounded bg-purple-600 text-white px-3 py-1.5 text-xs font-semibold no-underline">{el.props.label} ⬇{children}</a>;
  },
};
