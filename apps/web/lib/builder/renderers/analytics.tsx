import type { BlockRenderer } from './types';

export const analyticsRenderers: Record<string, BlockRenderer> = {
  'ga-tracking': ({ el, selectedId, selectElement, baseProps, children }) => {

  },
  'facebook-pixel': ({ el, selectedId, selectElement, baseProps, children }) => {

  },
  'gtm': ({ el, selectedId, selectElement, baseProps, children }) => {

  },
  'matomo': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} style={{ display: 'none' }} />;
  },
};
