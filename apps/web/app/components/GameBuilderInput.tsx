'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';

const EXAMPLES = [
  'A futuristic city at night with neon lights and flying cars',
  'A tropical beach at sunset with palm trees and waves',
  'A medieval village with cottages and a castle in the distance',
  'A space station orbiting Earth with asteroid field',
];

export function GameBuilderInput() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  function launch() {
    if (!prompt.trim()) return;
    const params = new URLSearchParams({ prompt });
    router.push(`/game-builder/create?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">
          Build <span className="text-indigo-400">3D Games</span> & Scenes
        </h2>
        <p className="text-white/50 text-sm">
          Describe your 3D world and watch it come to life
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && launch()}
          placeholder={EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]}
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm text-white placeholder-white/25 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          onClick={launch}
          disabled={!prompt.trim()}
          className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Create 🎮
        </button>
      </div>

      <div className="flex justify-center gap-3 mt-2">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          📚 Scene Library
        </Link>
        <Link
          href="/wonder-build/playcanvas"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          📁 Import Files
        </Link>
      </div>

      <p className="text-center text-xs text-white/20">
        Create immersive 3D experiences with PlayCanvas
      </p>
    </div>
  );
}