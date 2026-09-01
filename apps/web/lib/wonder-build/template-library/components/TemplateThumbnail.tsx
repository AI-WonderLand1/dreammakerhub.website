'use client';

import React, { useMemo } from 'react';
import { Eye, ArrowUpRight } from 'lucide-react';
import { WonderBuildElement, WonderBuildTemplate } from '../types';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function safeImageSrc(src?: string): string | undefined {
  if (!src) return undefined;
  const value = src.trim();

  if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
    return value;
  }

  if (/^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i.test(value)) {
    return value;
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
      const size = typeof element.styles?.fontSize === 'number' ? element.styles.fontSize : 0;
      const Tag = size > 28 ? 'h1' : size > 20 ? 'h2' : 'h3';
      return <Tag style={style}>{element.content || ''}</Tag>;
    }
    case 'text':
      return <p style={style}>{element.content || ''}</p>;
    case 'button':
      return (
        <button type="button" style={style}>
          {element.icon || ''}
          {element.content || ''}
        </button>
      );
    case 'image': {
      const src = safeImageSrc(element.src);
      if (!src || /(picsum|placehold\.co|dummyimage|via\.placeholder)/i.test(src)) {
        return (
          <div
            style={{
              ...style,
              minHeight: 140,
              borderRadius: 12,
              background: 'linear-gradient(135deg,#1e293b,#334155)',
            }}
          />
        );
      }

      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={element.alt || ''} style={{ maxWidth: '100%', ...style }} />;
    }
    case 'grid':
      return <div style={{ display: 'grid', ...style }}>{children}</div>;
    case 'nav':
      return <nav style={style}>{children}</nav>;
    case 'footer':
      return <footer style={style}>{children}</footer>;
    case 'card':
      return <div style={{ borderRadius: 12, ...style }}>{children}</div>;
    case 'section':
      return <section style={style}>{children}</section>;
    default:
      return <div style={style}>{children}</div>;
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

  // Real uploaded thumbnail (creator templates) — never generic placeholder hosts.
  const candidateImage = !hasElements ? thumbnailUrl || template?.thumbnail : undefined;
  const realImage =
    candidateImage && !/(picsum|placehold|dummyimage)/i.test(candidateImage)
      ? safeImageSrc(candidateImage)
      : undefined;

  const fallbackBg = useMemo(() => {
    const h = hashString(displayCategory + displayTitle) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${h} 45% 16%), hsl(${(h + 40) % 360} 50% 8%))`,
    };
  }, [displayCategory, displayTitle]);

  const SCALE = 0.5;
  const PREVIEW_WIDTH = 1280;

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-indigo-500/80 group/thumb transition-all duration-300 shadow-md hover:shadow-indigo-500/20 ${aspectRatio} ${className}`}
    >
      {hasElements ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            style={{
              width: PREVIEW_WIDTH,
              minHeight: 320,
              transform: `scale(${SCALE})`,
              transformOrigin: 'top left',
              fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
              backgroundColor: '#0f172a',
              color: '#f1f5f9',
            }}
          >
            {template!.elements.map((element, index) => (
              <PreviewElement
                key={element.id || `template-preview-${index}`}
                element={element}
              />
            ))}
          </div>
        </div>
      ) : realImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={realImage}
          alt={alt || displayTitle}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full" style={fallbackBg} />
      )}

      {displayBadge && (
        <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold bg-slate-950/85 backdrop-blur text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 z-10 shadow-sm capitalize">
          {displayBadge}
        </span>
      )}

      {showHoverOverlay && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20 pointer-events-none p-2">
          <div className="flex items-center space-x-1.5 bg-indigo-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-lg transform translate-y-1 group-hover/thumb:translate-y-0 transition-transform">
            <Eye className="w-3 h-3 text-indigo-200" />
            <span>Click to Preview</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
};
