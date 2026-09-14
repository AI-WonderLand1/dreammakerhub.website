export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const DEFAULT_HEADING: HeadingTag = 'h2';

export function normalizeHeadingLevel(value: unknown, fallback: HeadingTag = DEFAULT_HEADING): HeadingTag {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6) {
    return `h${value}` as HeadingTag;
  }

  if (typeof value === 'string') {
    const match = value.trim().toLowerCase().match(/^h?([1-6])$/);
    if (match) return `h${match[1]}` as HeadingTag;
  }

  return fallback;
}

export function headingLevelNumber(value: unknown, fallback = 2): number {
  const safeFallback = Number.isInteger(fallback) && fallback >= 1 && fallback <= 6 ? fallback : 2;
  return Number(normalizeHeadingLevel(value, `h${safeFallback}` as HeadingTag).slice(1));
}

export function isCanonicalHeadingLevel(value: unknown): value is HeadingTag {
  return typeof value === 'string' && /^h[1-6]$/.test(value.trim().toLowerCase());
}
