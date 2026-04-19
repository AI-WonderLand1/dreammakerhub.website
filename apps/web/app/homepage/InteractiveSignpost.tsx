'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Sign = {
  text: string;
  href: string;
  destination: string;
  top: string;
  left: string;
  width: string;
  height: string;
  color: string;
  preview?: string;
};

const SIGNS: Sign[] = [
  { text: 'this way',  href: '/docs',               destination: 'Documentation',  top: '14%', left: '22%', width: '17%', height: '7%',  color: '#fbbf24', preview: '/images/docs-preview.png' },
  { text: 'That way',  href: '/tutorials',           destination: 'Tutorials',      top: '23%', left: '20%', width: '19%', height: '7%',  color: '#34d399', preview: '/images/tutorials-preview.png' },
  { text: 'wrong way', href: '/community',           destination: 'Community',      top: '32%', left: '19%', width: '20%', height: '7%',  color: '#f87171', preview: '/images/community-preview.png' },
  { text: 'tea party', href: '/features',            destination: 'Features',       top: '41%', left: '18%', width: '21%', height: '7%',  color: '#c084fc', preview: '/images/features-preview.png' },
  { text: 'down here', href: '/wonder-build/playcanvas', destination: 'WebGL Studio',   top: '50%', left: '17%', width: '22%', height: '7%',  color: '#38bdf8', preview: '/images/playcanvas-preview.png' },
  { text: 'yonder',    href: '/wonderspace',         destination: 'WonderSpace IDE', top: '59%', left: '18%', width: '21%', height: '7%', color: '#fb923c', preview: '/images/wonderspace-preview.png' },
  { text: 'go back',   href: '/dashboard',           destination: 'Dashboard',      top: '67%', left: '19%', width: '20%', height: '7%',  color: '#a3e635', preview: '/images/dashboard-preview.png' },
];

interface InteractiveSignpostProps {
  iframeLabel?: string;
  heroMode?: boolean;
}

export default function InteractiveSignpost({ iframeLabel, heroMode = false }: InteractiveSignpostProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const overlays = SIGNS.map((sign, i) => {
    const isHovered = hoveredIndex === i;
    return (
      <div key={sign.href} style={{ position: 'relative' }}>
        <Link
          href={sign.href}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          aria-label={`${sign.text} — ${sign.destination}`}
          style={{
            position: 'absolute',
            top: sign.top,
            left: sign.left,
            width: sign.width,
            height: sign.height,
            zIndex: 20,
            clipPath: 'polygon(8% 0%, 100% 0%, 100% 100%, 8% 100%, 0% 50%)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            backgroundColor: isHovered ? `${sign.color}50` : 'transparent',
            outline: 'none',
          }}
        >
          {isHovered && (
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.88)',
                border: `1px solid ${sign.color}`,
                color: sign.color,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                backdropFilter: 'blur(6px)',
                zIndex: 30,
              }}
            >
              {sign.destination}
            </span>
          )}
        </Link>
        
        {/* Preview image overlay */}
        {isHovered && sign.preview && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 'calc(100% + 20px)',
              transform: 'translateY(-50%)',
              zIndex: 40,
              width: '300px',
              height: '200px',
              backgroundColor: 'rgba(0,0,0,0.9)',
              border: `2px solid ${sign.color}`,
              borderRadius: '12px',
              padding: '8px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <Image
              src={sign.preview}
              alt={`Preview of ${sign.destination}`}
              fill
              style={{
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                right: '8px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              {sign.destination}
            </div>
          </div>
        )}
      </div>
    );
  });

  if (heroMode) {
    return (
      <div className="absolute inset-0" aria-label={iframeLabel}>
        {overlays}
        <p className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-1.5 text-xs text-white/50 backdrop-blur-md">
          Click a sign to explore
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto aspect-[16/10] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10"
      aria-label={iframeLabel}
    >
      <Image
        src="/images/wonderland-theme.webp"
        alt="A whimsical wonderland forest scene with a wooden signpost pointing toward different paths."
        fill
        priority
        className="object-cover object-left"
        sizes="(max-width: 1024px) 100vw, 1024px"
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      {overlays}
      <p className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-1.5 text-xs text-white/50 backdrop-blur-md">
        Click a sign to explore
      </p>
    </div>
  );
}
