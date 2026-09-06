'use client';

import React, { useMemo } from 'react';
import { Eye, ArrowUpRight } from 'lucide-react';
import { WonderBuildElement, WonderBuildTemplate } from '../types';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function safeImageSrc(src?: string): string | undefined {
  if (!src) return undefined;
  const value = src.trim();
  if (!value) return undefined;

  try {
    const localBase = new URL('https://dreammakerhub.local');
    const parsed = new URL(value, localBase);

    if (parsed.origin === localBase.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function PreviewElement({ element }: { element: WonderBuildElement }) {
  const style = (element.styles || {}) as React.CSSProperties;
  const children = (element.children || []).map((child, index) => (
    <PreviewElement key={child.id || `${element.id || 'preview'}-${index}`} element={child} />
  ));

  switch (element.type) {
    case 'heading': {
      const rawSize = element.styles?.fontSize;
      const size = typeof rawSize === 'number' ? rawSize : typeof rawSize === 'string' ? Number.parseFloat(rawSize) : 0;
      const Tag = size > 28 ? 'h1' : size > 20 ? 'h2' : 'h3';
      return <Tag style={style}>{element.content || ''}</Tag>;
    }
    case 'text': return <p style={style}>{element.content || ''}</p>;
    case 'button': return <button type="button" style={style}>{element.icon || ''}{element.content || ''}</button>;
    case 'image': {
      const src = safeImageSrc(element.src);
      if (!src || /(picsum|placehold\.co|dummyimage|via\.placeholder)/i.test(src)) {
        return <div style={{ ...style, minHeight: 140, borderRadius: 12, background: 'linear-gradient(135deg,#111827,#172554 45%,#312e81)' }} />;
      }
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={element.alt || ''} style={{ maxWidth: '100%', ...style }} />;
    }
    case 'grid': return <div style={{ display: 'grid', ...style }}>{children}</div>;
    case 'nav': return <nav style={style}>{children}</nav>;
    case 'footer': return <footer style={style}>{children}</footer>;
    case 'card': return <div style={{ borderRadius: 12, ...style }}>{children}</div>;
    case 'section': return <section style={style}>{children}</section>;
    default: return <div style={style}>{children}</div>;
  }
}

interface TemplateThumbnailProps {
  template?: WonderBuildTemplate;
  thumbnailUrl?: string;
  alt?: string;
  title?: string;
  category?: string;
  className?: string;
  aspectRatio?: string;
  badgeText?: string;
  showHoverOverlay?: boolean;
}

export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = ({
  template,
  thumbnailUrl,
  alt,
  title,
  category,
  className = '',
  aspectRatio = 'aspect-video',
  badgeText,
  showHoverOverlay = true,
}) => {
  const displayTitle = title || template?.name || 'Template Preview';
  const displayCategory = category || template?.category || 'Layout';
  const displayBadge = badgeText || template?.variant || displayCategory;
  const hasElements = !!template?.elements?.length;
  const candidateImage = !hasElements ? thumbnailUrl || template?.thumbnail : undefined;
  const realImage = candidateImage && !/(picsum|placehold|dummyimage)/i.test(candidateImage) ? safeImageSrc(candidateImage) : undefined;

  const fallbackBg = useMemo(() => {
    const h = hashString(displayCategory + displayTitle) % 360;
    const h2 = (h + 48) % 360;
    return {
      background: `radial-gradient(circle at 72% 22%, hsla(${h2},90%,65%,.28), transparent 28%), radial-gradient(circle at 24% 78%, hsla(${h},85%,55%,.18), transparent 34%), linear-gradient(135deg, hsl(${h} 50% 13%), hsl(${h2} 55% 7%))`,
    };
  }, [displayCategory, displayTitle]);

  // Scale relative to the thumbnail container instead of forcing a fixed
  // 1280px preview into every card. This keeps the whole layout visible in
  // both tiny sidebar thumbnails and wide featured cards.
  const previewScale = 0.2;
  const previewCanvasPercent = `${100 / previewScale}%`;

  return (
    <div className={`wb-template-thumb group/thumb relative overflow-hidden border transition-all duration-300 ${aspectRatio} ${className}`}>
      <div className="pointer-events-none absolute left-3 right-3 top-2 z-[11] flex items-center gap-1 opacity-65">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-300/70" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300/70" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/70" />
        <span className="ml-1 h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      {hasElements ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden pt-4">
          <div
            style={{
              width: previewCanvasPercent,
              minHeight: previewCanvasPercent,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
              backgroundColor: '#0f172a',
              color: '#f1f5f9',
            }}
          >
            {template!.elements.map((element, index) => (
              <PreviewElement key={element.id || `template-preview-${index}`} element={element} />
            ))}
          </div>
        </div>
      ) : realImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={realImage} alt={alt || displayTitle} referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover/thumb:scale-[1.035]" />
      ) : (
        <div className="h-full w-full" style={fallbackBg}>
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/25 p-3 backdrop-blur-sm">
            <div className="h-1.5 w-1/3 rounded bg-white/35" />
            <div className="mt-2 h-1.5 w-2/3 rounded bg-white/10" />
            <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      )}

      {displayBadge && <span className="absolute left-2 top-5 z-10 rounded-md border border-violet-300/25 bg-[#080b18]/85 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] text-violet-200 shadow-lg backdrop-blur">{displayBadge}</span>}

      {showHoverOverlay && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#040713]/72 p-2 opacity-0 backdrop-blur-[3px] transition-opacity duration-250 group-hover/thumb:opacity-100">
          <div className="flex translate-y-1 items-center gap-1.5 rounded-xl border border-violet-300/25 bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-[10px] font-black text-white shadow-[0_12px_32px_rgba(124,58,237,.3)] transition-transform group-hover/thumb:translate-y-0">
            <Eye className="h-3 w-3" /><span>Customize in Builder</span><ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
};
