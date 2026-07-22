'use client';

import React from 'react';
import { useBuilderStore } from '../store';
import { CanvasElement } from '../types';

const LIBRARY_BLOCKS: Array<{ name: string; icon: string; defaultProps: Record<string, any>; defaultStyles: Record<string, any> }> = [
  {
    name: 'Hero Section',
    icon: '⚡',
    defaultProps: { title: 'AI-Powered Experiences', content: 'Build WordPress sites in real-time with AI Wonderland.' },
    defaultStyles: { backgroundColor: '#1e1b4b', padding: '2rem', borderRadius: '0.75rem' },
  },
  {
    name: 'Heading',
    icon: '🔤',
    defaultProps: { title: 'Heading Title' },
    defaultStyles: { color: '#ffffff', fontSize: '1.5rem', fontWeight: '700' },
  },
  {
    name: 'Button',
    icon: '🔘',
    defaultProps: { content: 'Get Started' },
    defaultStyles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '0.5rem' },
  },
  {
    name: 'Feature Grid',
    icon: '🔲',
    defaultProps: { title: 'Core Features' },
    defaultStyles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' },
  },
];

export default function ComponentLibrary() {
  const { addElement } = useBuilderStore();

  const handleAdd = (block: typeof LIBRARY_BLOCKS[0]) => {
    const newElement: CanvasElement = {
      id: `el_${Date.now()}`,
      type: block.name.toLowerCase().replace(/\s+/g, '-'),
      name: block.name,
      props: block.defaultProps,
      styles: block.defaultStyles,
    };
    addElement(newElement);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-white p-4 border-r border-white/10 w-72">
      <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-4">Block Library</h3>
      <div className="grid grid-cols-2 gap-2">
        {LIBRARY_BLOCKS.map((block) => (
          <button
            key={block.name}
            onClick={() => handleAdd(block)}
            className="p-3 rounded-lg border border-white/10 bg-white/5 hover:border-purple-500 hover:bg-purple-500/10 flex flex-col items-center gap-2 text-center transition-all group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">{block.icon}</span>
            <span className="text-xs font-medium text-white/80">{block.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
