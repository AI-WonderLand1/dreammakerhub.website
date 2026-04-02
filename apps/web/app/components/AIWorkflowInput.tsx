'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type BuildType = 'website' | 'game' | 'component' | 'playcanvas';

const TYPE_OPTIONS: { value: BuildType; icon: string; label: string }[] = [
  { value: 'website',    icon: '🌐', label: 'Website'    },
  { value: 'game',       icon: '🎮', label: 'Game'        },
  { value: 'component',  icon: '🧩', label: 'Component'   },
  { value: 'playcanvas', icon: '🎯', label: 'PlayCanvas'  },
];

const EXAMPLES: Record<BuildType, string> = {
  website:    'A dark sci-fi portfolio with animated hero...',
  game:       'A neon snake game with increasing speed...',
  component:  'An animated pricing table with yearly toggle...',
  playcanvas: 'A rotating 3D robot with idle animation...',
};

export function AIWorkflowInput() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [buildType, setBuildType] = useState<BuildType>('website');

  function launch() {
    if (!prompt.trim()) return;
    const params = new URLSearchParams({ prompt, type: buildType });
    router.push(`/wonder-build?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Build type selector */}
      <div className="grid grid-cols-4 gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setBuildType(opt.value)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
              buildType === opt.value
                ? 'border-violet-500/60 bg-violet-500/15 text-violet-200 shadow-lg shadow-violet-900/20'
                : 'border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white/80'
            }`}
          >
            <span>{opt.icon}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Input + button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && launch()}
          placeholder={EXAMPLES[buildType]}
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
