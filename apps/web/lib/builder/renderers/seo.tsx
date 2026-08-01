import type { BlockRenderer } from './types';

export const seoRenderers: Record<string, BlockRenderer> = {
  'meta-tags': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'none' }} />;
  },
  'schema-markup': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'none' }} />;
  },
  'ga-tracking': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'none' }} />;
  },
  'facebook-pixel': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'none' }} />;
  },
  'gtm': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'none' }} />;
  },
  'matomo': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'none' }} />;
  },
};
