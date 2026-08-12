'use client';
import React, { useState } from 'react';
import { WonderBuildTemplate } from '../types';
import { Eye, ArrowUpRight } from 'lucide-react';

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

// High Quality Curated Unsplash Images for Category & Variant Layouts
export const getCategoryVariantImage = (cat: string = '', titleOrVariant: string = ''): string => {
  const c = cat.toLowerCase();
  const v = titleOrVariant.toLowerCase();

  // 3D Website Templates
  if (c.includes('3d') || v.includes('3d') || c.includes('spatial') || c.includes('canvas')) {
    if (v.includes('hero') || v.includes('interactive')) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
    if (v.includes('product') || v.includes('showcase')) return 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80';
    if (v.includes('metaverse') || v.includes('web3') || v.includes('studio')) return 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&w=600&q=80';
    if (v.includes('cyberpunk') || v.includes('dark')) return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80';
    if (v.includes('spline') || v.includes('canvas')) return 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  }

  // SaaS
  if (c.includes('saas')) {
    if (v.includes('bold') || v.includes('dark')) return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80';
    if (v.includes('dash')) return 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80';
    if (v.includes('pricing')) return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
    if (v.includes('comp')) return 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80';
  }

  // Agency & Portfolio
  if (c.includes('agency') || c.includes('portfolio')) {
    if (v.includes('creative') || v.includes('studio')) return 'https://images.unsplash.com/photo-1542744094-3a3172720a8a?auto=format&fit=crop&w=600&q=80';
    if (v.includes('case')) return 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80';
    if (v.includes('brand')) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80';
  }

  // E-Commerce
  if (c.includes('ecommerce') || c.includes('commerce') || c.includes('store')) {
    if (v.includes('fashion') || v.includes('apparel')) return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80';
    if (v.includes('gadget') || v.includes('tech')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
    if (v.includes('single')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80';
  }

  // Fintech
  if (c.includes('fintech') || c.includes('finance') || c.includes('banking')) {
    if (v.includes('crypto')) return 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80';
    if (v.includes('invest')) return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80';
  }

  // Health / Wellness
  if (c.includes('health') || c.includes('wellness') || c.includes('fitness')) {
    if (v.includes('yoga') || v.includes('meditation')) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80';
    if (v.includes('clinic') || v.includes('medical')) return 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80';
  }

  // Blog / Editorial
  if (c.includes('blog') || c.includes('editorial') || c.includes('magazine')) {
    if (v.includes('tech')) return 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80';
  }

  // Real Estate
  if (c.includes('real estate') || c.includes('property')) {
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
  }

  // Restaurant / Food
  if (c.includes('restaurant') || c.includes('food')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';
  }

  // Education
  if (c.includes('education') || c.includes('lms') || c.includes('course')) {
    return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80';
  }

  // Event
  if (c.includes('event') || c.includes('conference')) {
    return 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80';
  }

  // Travel
  if (c.includes('travel') || c.includes('hospitality')) {
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
  }

  // Non-profit
  if (c.includes('non-profit') || c.includes('cause')) {
    return 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&w=600&q=80';
  }

  // Entertainment
  if (c.includes('entertainment') || c.includes('media')) {
    return 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80';
};

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
  const sanitizeImageUrl = (value?: string): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
    } catch {
      return '';
    }
  };

  const [imgError, setImgError] = useState(false);

  const displayTitle = title || template?.name || 'Template Preview';
  const displayCategory = category || template?.category || 'Layout';
  const displayBadge = badgeText || template?.variant || displayCategory;

  // Resolve image source cleanly
  const initialSrc = sanitizeImageUrl(thumbnailUrl || template?.thumbnail);
  const isPicsum = initialSrc?.includes('picsum.photos');
  const effectiveSrc = (!initialSrc || isPicsum || imgError)
    ? getCategoryVariantImage(displayCategory, displayTitle)
    : initialSrc;

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-indigo-500/80 group/thumb transition-all duration-300 shadow-md hover:shadow-indigo-500/20 ${aspectRatio} ${className}`}
    >
      <img
        src={effectiveSrc}
        alt={alt || displayTitle}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
      />

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
