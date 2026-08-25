'use client';
import React, { useMemo, useState } from 'react';
import { WonderBuildTemplate } from '../types';
import { Eye, ArrowUpRight } from 'lucide-react';
import { templateElementsToHTML } from '../utils/previewHtml';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
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
  const [previewHeight, setPreviewHeight] = useState(160);

  const displayTitle = title || template?.name || 'Template Preview';
  const displayCategory = category || template?.category || 'Layout';
  const displayBadge = badgeText || template?.variant || displayCategory;

  const hasElements = !!template?.elements?.length;
  const previewHtml = useMemo(
    () => (hasElements ? templateElementsToHTML(template!.elements) : null),
    [template, hasElements]
  );

  // Real uploaded thumbnail (creator templates) — never generic placeholder hosts.
  const candidateImage = !hasElements ? thumbnailUrl || template?.thumbnail : undefined;
  const realImage =
    candidateImage && !/(picsum|placehold|dummyimage)/.test(candidateImage)
      ? candidateImage
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
      {previewHtml ? (
        <div
          className="pointer-events-none absolute top-0 left-0"
          style={{
            width: PREVIEW_WIDTH * SCALE,
            height: previewHeight * SCALE,
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
          }}
        >
          <iframe
            title={displayTitle}
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            width={PREVIEW_WIDTH}
            height={previewHeight}
            onLoad={(e) => {
              const doc = e.currentTarget.contentDocument;
              const h = doc?.documentElement?.scrollHeight || 160;
              if (h !== previewHeight) setPreviewHeight(h);
            }}
            tabIndex={-1}
            className="border-0 block"
          />
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

      {/* Overlay Badge */}
      {displayBadge && (
        <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold bg-slate-950/85 backdrop-blur text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 z-10 shadow-sm capitalize">
          {displayBadge}
        </span>
      )}

      {/* Hover Overlay Effect with Eye Icon & Preview hint */}
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
