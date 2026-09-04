import createDOMPurify, { type Config } from 'dompurify';

let purifier: ReturnType<typeof createDOMPurify> | null = null;

const HTML_CONFIG: Config = {
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

const SVG_CONFIG: Config = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: [
    'script',
    'foreignObject',
    'iframe',
    'object',
    'embed',
    'audio',
    'video',
  ],
  FORBID_ATTR: ['srcdoc'],
  ALLOW_DATA_ATTR: false,
};

const TRUSTED_EMBED_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'www.loom.com',
]);

function getPurifier(): ReturnType<typeof createDOMPurify> | null {
  if (typeof window === 'undefined') return null;
  if (!purifier) purifier = createDOMPurify(window);
  return purifier;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Sanitize rich text and custom HTML immediately before it reaches a browser
 * HTML interpretation sink. On the server, fail closed instead of returning
 * untrusted markup; the WonderBuild editor renders these blocks client-side.
 */
export function sanitizeBuilderHtml(value: unknown): string {
  const html = asString(value);
  const instance = getPurifier();
  return instance ? instance.sanitize(html, HTML_CONFIG) : '';
}

/**
 * SVG needs a separate allow-profile so harmless shapes/gradients still work
 * while script-capable elements such as script and foreignObject are removed.
 */
export function sanitizeBuilderSvg(value: unknown): string {
  const svg = asString(value);
  const instance = getPurifier();
  return instance ? instance.sanitize(svg, SVG_CONFIG) : '';
}

/**
 * Generic iframe blocks are restricted to known media providers and HTTPS.
 * This prevents arbitrary same-origin or attacker-controlled pages from being
 * embedded inside the authenticated editor.
 */
export function sanitizeEmbedUrl(value: unknown): string | null {
  const raw = asString(value).trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    if (!TRUSTED_EMBED_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function sanitizeYouTubeVideoId(value: unknown): string | null {
  const id = asString(value).trim();
  return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}
