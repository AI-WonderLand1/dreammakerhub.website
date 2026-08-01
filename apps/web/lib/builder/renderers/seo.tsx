import type { BlockRenderer } from './types';

export const seoRenderers: Record<string, BlockRenderer> = {
  'meta-tags', 'schema-markup', 'ga-tracking', 'facebook-pixel', 'gtm', 'matomo': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'none' }} />;
  },
};
