'use client';

import React, { useState } from 'react';
import { logger } from '@/lib/logger';

interface ImageSliderProps {
  originalUrl: string;
  resultUrl: string;
}

const ImageSlider = ({ originalUrl, resultUrl }: ImageSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  return (
    <div 
      className="relative w-full aspect-video overflow-hidden rounded-xl border border-white/10 cursor-ew-resize"
      onMouseMove={handleMouseMove}
    >
      {/* Result Image (Right side) */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${resultUrl})` }}
      />

      {/* Original Image (Left side with clip-path) */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${originalUrl})`,
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
        }}
      />

      {/* Divider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
           <span className="text-black text-xs font-bold">↔</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white">
        Original Image
      </div>
      <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white">
        3D Result
      </div>
    </div>
  );
};

export default ImageSlider;
