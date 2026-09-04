'use client';

import type { CSSProperties } from 'react';
import type { BuilderTheme, CanvasElement } from '../types';
import { renderElement } from '../renderers';

const URLISH_PROP = /(?:url|href|src|link|action|poster)$/i;
const SAFE_ABSOLUTE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function sanitizePublishedUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  if (raw.startsWith('//')) return '#';
  if (raw.startsWith('#') || raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../') || raw.startsWith('?')) {
    return raw;
  }
  if (/^data:image\/(?:png|jpeg|jpg|gif|webp|avif);/i.test(raw)) return raw;

  try {
    const url = new URL(raw);
    return SAFE_ABSOLUTE_PROTOCOLS.has(url.protocol.toLowerCase()) ? raw : '#';
  } catch {
    return '#';
  }
}

function sanitizePropValue(value: unknown, key = ''): unknown {
  if (typeof value === 'string' && URLISH_PROP.test(key)) {
    return sanitizePublishedUrl(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizePropValue(entry));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
        childKey,
        sanitizePropValue(childValue, childKey),
      ]),
    );
  }
  return value;
}

function sanitizePublishedElement(element: CanvasElement): CanvasElement {
  return {
    ...element,
    props: sanitizePropValue(element.props) as CanvasElement['props'],
    children: element.children?.map(sanitizePublishedElement),
  };
}

function PublishedElement({ element }: { element: CanvasElement }) {
  const safeElement = sanitizePublishedElement(element);
  const style = { ...(safeElement.styles as CSSProperties) };
  const children = safeElement.children?.map((child) => (
    <PublishedElement key={child.id} element={child} />
  ));

  return <>{renderElement({
    el: safeElement,
    selectedId: null,
    selectElement: () => {},
    baseProps: {
      style,
      className: `builder-element type-${safeElement.type}`,
    },
    style,
    children,
  })}</>;
}

export default function PublishedBuilderPage({
  elements,
  theme,
}: {
  elements: CanvasElement[];
  theme?: BuilderTheme;
}) {
  const rootStyle: CSSProperties = {
    backgroundColor: theme?.colors?.background || '#ffffff',
    color: theme?.colors?.text || '#0f172a',
    fontFamily: theme?.fonts?.body || 'Inter, system-ui, sans-serif',
  };

  return (
    <main className="min-h-screen w-full" style={rootStyle}>
      {elements.map((element) => (
        <PublishedElement key={element.id} element={element} />
      ))}
    </main>
  );
}
