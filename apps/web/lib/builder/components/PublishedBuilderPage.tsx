'use client';

import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactElement,
} from 'react';
import type { BuilderTheme, CanvasElement } from '../types';
import { renderElement } from '../renderers';

const URLISH_PROP = /(?:url|href|src|link|poster)$/i;
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
  if (Array.isArray(value)) return value.map((entry) => sanitizePropValue(entry));
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

function interactionClass(element: CanvasElement, scrollVisible: boolean): string {
  const hover = String(element.props?.hoverEffect || 'none');
  const scroll = String(element.props?.scrollEffect || 'none');
  return [
    `builder-element type-${element.type}`,
    hover !== 'none' ? `wb-hover-${hover}` : '',
    scroll !== 'none' ? 'wb-scroll-pending' : '',
    scroll !== 'none' && scrollVisible ? `wb-scroll-${scroll}` : '',
    element.props?.clickAction && element.props.clickAction !== 'none' ? 'wb-interactive' : '',
  ].filter(Boolean).join(' ');
}

function PublishedElement({ element }: { element: CanvasElement }) {
  const safeElement = sanitizePublishedElement(element);
  const style = { ...(safeElement.styles as CSSProperties) };
  const scrollEffect = String(safeElement.props?.scrollEffect || 'none');
  const rootRef = useRef<HTMLElement | null>(null);
  const [scrollVisible, setScrollVisible] = useState(scrollEffect === 'none');

  const children = safeElement.children?.map((child) => (
    <PublishedElement key={child.id} element={child} />
  ));

  useEffect(() => {
    if (scrollEffect === 'none') {
      setScrollVisible(true);
      return;
    }

    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setScrollVisible(true);
      return;
    }

    setScrollVisible(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setScrollVisible(true);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [safeElement.id, scrollEffect]);

  const handleInteraction = (event: ReactMouseEvent<HTMLElement>) => {
    const action = String(safeElement.props?.clickAction || 'none');
    if (action === 'navigate') {
      const target = sanitizePublishedUrl(String(safeElement.props?.clickUrl || ''));
      if (!target || target === '#') return;
      event.preventDefault();
      event.stopPropagation();
      const newTab = Boolean(safeElement.props?.clickNewTab) && /^https?:/i.test(target);
      if (newTab) window.open(target, '_blank', 'noopener,noreferrer');
      else window.location.assign(target);
      return;
    }

    if (action === 'scroll-to') {
      const target = String(safeElement.props?.scrollTarget || '').replace(/[^a-zA-Z0-9_:-]/g, '');
      if (!target) return;
      const destination = document.getElementById(target);
      if (!destination) return;
      event.preventDefault();
      event.stopPropagation();
      destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const rendered = renderElement({
    el: safeElement,
    selectedId: null,
    selectElement: () => {},
    baseProps: {
      style,
      className: `builder-element type-${safeElement.type}`,
    },
    style,
    children,
  });

  if (!isValidElement(rendered)) return <>{rendered}</>;

  const root = rendered as ReactElement<any>;
  const existingClassName = typeof root.props.className === 'string' ? root.props.className : '';
  const existingOnClick = typeof root.props.onClick === 'function' ? root.props.onClick : null;
  const safeHtmlId = typeof safeElement.props?.htmlId === 'string'
    ? safeElement.props.htmlId.replace(/[^a-zA-Z0-9_:-]/g, '')
    : undefined;

  return cloneElement(root, {
    ref: (node: HTMLElement | null) => {
      rootRef.current = node;
    },
    id: safeHtmlId || root.props.id,
    className: [existingClassName, interactionClass(safeElement, scrollVisible)].filter(Boolean).join(' '),
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      existingOnClick?.(event);
      if (!event.defaultPrevented) handleInteraction(event);
    },
  });
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
      <style>{`
        .wb-interactive { cursor: pointer; }
        .wb-hover-lift, .wb-hover-scale, .wb-hover-glow { transition: transform .22s ease, box-shadow .22s ease, filter .22s ease; }
        .wb-hover-lift:hover { transform: translateY(-6px); }
        .wb-hover-scale:hover { transform: scale(1.035); }
        .wb-hover-glow:hover { box-shadow: 0 0 32px rgba(139,92,246,.38); }
        .wb-hover-underline:hover { text-decoration: underline; }
        .wb-scroll-pending { opacity: 0; }
        .wb-scroll-fade-in { animation: wbPublishedFadeIn .55s ease both; }
        .wb-scroll-slide-up { animation: wbPublishedSlideUp .6s cubic-bezier(.2,.75,.25,1) both; }
        @keyframes wbPublishedFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wbPublishedSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .wb-scroll-pending { opacity: 1 !important; }
          .wb-hover-lift, .wb-hover-scale, .wb-hover-glow, .wb-scroll-fade-in, .wb-scroll-slide-up { animation: none !important; transition: none !important; transform: none !important; }
        }
      `}</style>
      {elements.map((element) => (
        <PublishedElement key={element.id} element={element} />
      ))}
    </main>
  );
}
