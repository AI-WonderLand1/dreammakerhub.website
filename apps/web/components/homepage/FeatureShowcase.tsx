'use client';

import { useState, useEffect } from 'react';

interface FeatureSlide {
  id: number;
  image: string;
  alt: string;
  title: string;
  description: string;
  href: string;
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: 1,
    image: '/images/screenshots/playcanvas-builder.svg',
    alt: 'WonderPlay 3D Builder',
    title: 'WonderPlay 3D',
    description: 'Create stunning 3D games and spatial experiences with our PlayCanvas-powered editor',
    href: '/wonder-build/playcanvas'
  },
  {
    id: 2,
    image: '/images/screenshots/puck-builder.svg',
    alt: 'Puck Page Builder',
    title: 'Visual Page Builder',
    description: 'Drag-and-drop website builder with 19+ blocks for creating beautiful pages',
    href: '/wonder-build'
  },
  {
    id: 3,
    image: '/images/screenshots/theia-builder.svg',
    alt: 'WonderSpace IDE',
    title: 'WonderSpace IDE',
    description: 'Full-featured browser-based IDE with Monaco Editor and WebContainer runtime',
    href: '/wonderspace'
  },
  {
    id: 4,
    image: '/images/screenshots/webgl-builder.svg',
    alt: 'WebGL Studio Builder',
    title: 'WebGL Studio',
    description: 'Advanced 3D graphics editor for creating custom shaders and visual effects',
    href: '/wonder-build/webgl'
  }
];

export default function FeatureShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % FEATURE_SLIDES.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="relative w-full max-w-4xl space-y-6">
          {/* Slides */}
          {FEATURE_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 opacity-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              } pointer-events-none`}
            >
              <div className="relative flex h-[200px] w-full rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 1/2 * 100vw, 340px"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                  <h3 className="mb-2 text-xl font-semibold">{slide.title}</h3>
                  <p className="max-w-md text-sm text-white/80">{slide.description}</p>
                  <a
                    href={slide.href}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-sm font-semibold text-white hover:scale-105 transition-transform"
                  >
                    Explore {slide.title} →
                  </a>
                </div>
              </div>
            </div>
          ))}
          
          /* Navigation dots */
          <div className="flex justify-center space-x-2">
            {FEATURE_SLIDES.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full bg-white/30 transition-colors duration-300 ${
                  index === currentIndex ? 'bg-white' : 'bg-white/30'
                } hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/50`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}