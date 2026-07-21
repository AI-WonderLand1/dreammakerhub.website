'use client';

import React from 'react';
import Link from 'next/link';
import { LibraryAsset } from '@/lib/library/types';
import { logger } from '@/lib/logger';

const ASSETS: LibraryAsset[] = [
  {
    id: 'robot1',
    name: 'Robot Alpha',
    type: 'model',
    url: '/robots/robot1.glb',
    description: 'A basic humanoid robot model for testing animations.',
    category: 'Characters',
    thumbnail: '/robots/robot1.glb', // In a real app, this would be a preview image
  },
  {
    id: 'robot2',
    name: 'Robot Beta',
    type: 'model',
    url: '/robots/robot2.glb',
    description: 'An advanced combat-ready robot model.',
    category: 'Characters',
    thumbnail: '/robots/robot2.glb',
  },
  {
    id: 'robot3',
    name: 'Robot Gamma',
    type: 'model',
    url: '/robots/robot3.glb',
    description: 'A utility robot optimized for environmental tasks.',
    category: 'Characters',
    thumbnail: '/robots/robot3.glb',
  },
];

export default function ThreeDLibraryPage() {
  const categories = Array.from(new Set(ASSETS.map((a) => a.category)));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            3D Asset Library
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Explore and download high-quality 3D models and assets for your Wonderland projects.
          </p>
        </header>

        <div className="flex flex-wrap gap-4 mb-12">
          <button className="px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition">
            All Assets
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {ASSETS.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-cyan-500/50 transition-all duration-300"
            >
              <div className="aspect-video bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                {/* Placeholder for 3D Preview */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                   <span className="text-6xl">📦</span>
                </div>
                <span className="relative z-10 text-sm text-white/40 group-hover:text-white/60 transition-colors">
                  {asset.type.toUpperCase()} PREVIEW
                </span>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {asset.name}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 bg-white/5 px-2 py-0.5 rounded">
                    {asset.category}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {asset.description}
                </p>
                <div className="flex items-center justify-between">
                  <Link
                    href="#"
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Details →
                  </Link>
                  <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
