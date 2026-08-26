'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

const EXAMPLES = [
  'A dark sci-fi portfolio for a 3D artist with animated hero and project gallery',
  'A luxury hotel landing page with parallax images and booking CTA',
  'A SaaS dashboard with sidebar, analytics cards, and data table',
  'A modern portfolio with glassmorphism effects and smooth animations',
];

export function AIWorkflowInput() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  function launch() {
    if (!prompt.trim()) return;
    router.push(`/wonder-build/builder?${new URLSearchParams({ prompt, type: 'website' }).toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && launch()}
          placeholder={EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]}
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm text-white placeholder-white/25 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
        />
        <button
          onClick={launch}
          disabled={!prompt.trim()}
          className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Build ✨
        </button>
      </div>

      <p className="text-center text-xs text-white/20">
        Press Enter or hit Build — your AI agents start instantly
      </p>
    </div>
  );
}