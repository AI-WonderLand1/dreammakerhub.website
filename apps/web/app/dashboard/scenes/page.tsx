'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Scene {
  id: string;
  name: string;
  thumbnail: string;
  lastEdited: string;
  objects: number;
}

export default function SceneDashboard() {
  const [scenes, setScenes] = useState<Scene[]>([
    { id: '1', name: 'Forest Adventure', thumbnail: '🌲', lastEdited: '2 hours ago', objects: 45 },
    { id: '2', name: 'Boss Battle Arena', thumbnail: '⚔️', lastEdited: '1 day ago', objects: 128 },
    { id: '3', name: 'Space Station', thumbnail: '🚀', lastEdited: '3 days ago', objects: 234 },
  ]);

  const createNewScene = () => {
    const newId = `scene-${Date.now()}`;
    // Navigate to editor with new scene
    window.location.href = `/editor?scene=${newId}&new=true`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">🎮 My Scenes</h1>
        <p className="text-white/60 text-lg">Choose a scene to edit or create something new</p>
      </header>

      {/* Create New - Prominent */}
      <div className="mb-10">
        <button
          onClick={createNewScene}
          className="w-full max-w-md py-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold rounded-xl text-xl transition flex items-center justify-center gap-3"
        >
          <span className="text-3xl">+</span>
          Create New Scene
        </button>
      </div>

      {/* Scene Library Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-blue-400">Your Scenes ({scenes.length})</h2>
        
        {scenes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-xl text-white/40">No scenes yet</p>
            <p className="text-white/60 mt-2">Create your first scene above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {scenes.map((scene) => (
              <Link
                key={scene.id}
                href={`/editor?scene=${scene.id}`}
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-xl p-6 transition"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 flex items-center justify-center text-6xl group-hover:scale-105 transition">
                  {scene.thumbnail}
                </div>
                
                {/* Info */}
                <h3 className="font-bold text-lg mb-1 group-hover:text-cyan-400 transition truncate">
                  {scene.name}
                </h3>
                <div className="text-sm text-white/40">
                  <p>{scene.objects} objects</p>
                  <p>Edited {scene.lastEdited}</p>
                </div>
                
                {/* Edit indicator */}
                <div className="mt-4 text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                  Click to edit →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
