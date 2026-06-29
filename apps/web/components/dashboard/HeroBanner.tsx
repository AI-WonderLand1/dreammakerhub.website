'use client';

import React from 'react';
import { Wand2, ArrowRight } from 'lucide-react';
import ImageSlider from './ImageSlider';

const HeroBanner = () => {
  // Placeholder URLs for demonstration
  const originalUrl = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=1000&auto=format&fit=crop';
  const resultUrl = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop';

  return (
    <section className="relative w-full rounded-2xl border border-white/10 bg-[#0F131C] overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Text Panel (Left 45%) */}
        <div className="w-full lg:w-[45%] p-8 lg:p-12 flex flex-col justify-center z-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4">
            AI 3D GENERATOR
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Turn Ideas into <br />
            <span className="bg-gradient-to-r from-[#5046E6] to-[#7C3AED] bg-clip-text text-transparent">
              Stunning 3D Models
            </span>
          </h1>
          <p className="text-slate-400 text-base mb-8 max-w-md leading-relaxed">
            Generate high-fidelity 3D assets from simple text prompts or 2D images in seconds using our advanced neural engine.
          </p>
          <button className="flex items-center gap-2 w-fit px-6 py-3 rounded-xl bg-gradient-to-r from-[#5046E6] to-[#7C3AED] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
            <Wand2 className="w-5 h-5" />
            Generate 3D Model
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Interactive Split Slider (Right 55%) */}
        <div className="w-full lg:w-[55%] p-4 lg:p-8 bg-[#07090E]/50 flex items-center justify-center">
          <div className="w-full max-w-xl">
            <ImageSlider originalUrl={originalUrl} resultUrl={resultUrl} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
