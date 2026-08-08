'use client';
import React from 'react';
import { ThreeViewport } from './ThreeViewport';
import { AssetCategory } from '../types';
import { 
  Box, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Zap, 
  Layers, 
  Flame, 
  Globe2,
  ArrowRight
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface HeroSectionProps {
  onCategorySelect: (category: AssetCategory | 'all') => void;
  selectedCategory: AssetCategory | 'all';
  onExploreClick: () => void;
  onSandboxClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCategorySelect,
  selectedCategory,
  onExploreClick,
  onSandboxClick,
}) => {
  const categories: { id: AssetCategory | 'all'; label: string; count: string }[] = [
    { id: 'all', label: 'All Assets', count: '45,200+' },
    { id: 'models', label: '3D Models', count: '28,400' },
    { id: 'materials', label: '4K PBR Materials', count: '8,900' },
    { id: 'environments', label: 'Environments', count: '3,100' },
    { id: 'vfx', label: 'VFX & Shaders', count: '2,400' },
    { id: 'building_kits', label: 'Modular Kits', count: '1,800' },
    { id: 'audio', label: 'Sound FX', count: '600' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black/80 via-[#020203] to-[#020203] pt-8 pb-12 border-b border-white/5">
      {/* Radial Gradient Ambient Background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Hero Copy & CTA */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span>NEXUS 3D MARKETPLACE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.1]">
              Elevate Your World With{' '}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
                Next-Gen 3D Assets
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Explore thousands of verified game-ready 3D models, procedural 4K PBR materials, Niagara VFX particle systems, and environment kits. Inspect every mesh in live 360° WebGL 3D.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  onExploreClick();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
              >
                <Box className="w-4 h-4" />
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  onSandboxClick();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-zinc-200 hover:border-cyan-500/40 hover:bg-white/10 transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Launch Studio Sandbox</span>
              </button>
            </div>

            {/* Value Props Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/5">
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">45,000+</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Verified Assets</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-purple-400">2.4M+</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Downloads</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">100%</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">PBR & WebGL Ready</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-amber-400">4.9 ★</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Creator Rating</p>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Featured 3D WebGL Model */}
          <div className="lg:col-span-5 relative">
            <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-2xl">
              <ThreeViewport
                modelType="mech"
                primaryColor="#00F0FF"
                className="w-full h-full"
                autoRotateDefault={true}
                showControlsBar={true}
              />
            </div>
            <p className="text-center text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">
              Interactive Featured Model: Apex-V Combat Mech (360° Drag & Zoom)
            </p>
          </div>

        </div>

        {/* Category Filter Pills Bar */}
        <div className="mt-10 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] pr-2 flex items-center gap-1.5 shrink-0">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Category:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sounds.playClick();
                    onCategorySelect(cat.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-zinc-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
