'use client';

import { Layout, Book, HelpCircle } from 'lucide-react';

// This interface explicitly defines 'onSelect' so the build passes
interface BlueprintProps {
  onSelect: (id: string) => void;
}

export default function BlueprintGallery({ onSelect }: BlueprintProps) {
  const blueprints = [
    { id: 'docs', name: 'Documentation', icon: <Book size={18}/> },
    { id: 'faq', name: 'Knowledge Base', icon: <HelpCircle size={18}/> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {blueprints.map((bp) => (
        <button
          key={bp.id}
          onClick={() => onSelect(bp.id)}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
            {bp.icon}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">{bp.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
