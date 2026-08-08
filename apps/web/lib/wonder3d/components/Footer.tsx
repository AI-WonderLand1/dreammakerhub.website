'use client';
import React from 'react';
import { Box, Github, Twitter, Disc as Discord, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black/40 border-t border-white/5 pt-12 pb-8 mt-16 text-zinc-400 text-xs backdrop-blur-xl relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <Box className="w-4 h-4 text-black" />
              </div>
              <span className="text-base font-bold text-white tracking-tighter">NEXUS<span className="text-cyan-400">3D</span></span>
            </div>
            <p className="text-zinc-500 leading-relaxed">
              The high-performance marketplace for game creators, VFX artists, and 3D generalists. Real-time WebGL inspection & 4K PBR shader standards.
            </p>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em]">3D Assets</p>
            <ul className="space-y-1.5 text-zinc-400">
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Game Ready Models</li>
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Procedural PBR Shaders</li>
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Niagara VFX Particles</li>
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">8K Celestial HDRIs</li>
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Modular Building Kits</li>
            </ul>
          </div>

          {/* Col 3: Engine Compatibility */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em]">Engine Support</p>
            <ul className="space-y-1.5 text-zinc-400">
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Unreal Engine 5.4+</li>
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Unity 6 & Universal RP</li>
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Blender 4.2 LTS</li>
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Godot Engine 4.3</li>
              <li className="hover:text-cyan-400 cursor-pointer transition-colors">Three.js WebGL / R3F</li>
            </ul>
          </div>

          {/* Col 4: Licensing */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em]">Royalty-Free Guarantee</p>
            <p className="text-zinc-500 leading-relaxed">
              All commercial assets are vetted for clean quad geometry, non-overlapping UVs, and clear commercial usage terms.
            </p>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] pt-1">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>100% Royalty Free</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 font-mono text-[11px]">
          <p>© 2026 NEXUS 3D Marketplace. Built with React & Three.js WebGL.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Terms of License</span>
            <span>•</span>
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Creator Guidelines</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
