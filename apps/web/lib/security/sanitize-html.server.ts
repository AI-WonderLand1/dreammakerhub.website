import 'server-only';

import createDOMPurify, { type Config } from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('<!doctype html><html><body></body></html>').window;
const purifier = createDOMPurify(
  window as unknown as Parameters<typeof createDOMPurify>[0],
);

const SANITIZE_CONFIG: Config = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: [
    'script',
    'iframe',
    'object',
    'embed',
    'base',
    'link',
    'meta',
    'form',
    'svg',
    'math',
  ],
  FORBID_ATTR: ['srcdoc'],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize HTML from users, stored projects, or model output before it reaches
 * an HTML interpretation sink. DOMPurify removes event handlers and unsafe
 * protocol URLs in addition to the explicitly forbidden tags above.
 */
export function sanitizeUntrustedHtml(html: string): string {
  return purifier.sanitize(html, SANITIZE_CONFIG);
}
