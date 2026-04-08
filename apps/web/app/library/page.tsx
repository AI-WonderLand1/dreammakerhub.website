"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SceneTemplate = {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string;
};

export default function LibraryPage() {
  const [scenes, setScenes] = useState<SceneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadScenes() {
      try {
        const res = await fetch("/api/scenes/templates");
        if (res.ok) {
          const data = await res.json();
          setScenes(data.templates || []);
        }
      } catch (error) {
        console.error("Failed to load scenes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadScenes();
  }, []);

  const categories = ["all", "nature", "city", "space", "fantasy", "sci-fi"];

  const filteredScenes = selectedCategory === "all" 
    ? scenes 
    : scenes.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-indigo-400">Scene Library</h1>
              <p className="text-white/60 mt-1">Choose a pre-made scene to start with</p>
            </div>
            <Link
              href="/game-builder/create"
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition"
            >
              + Describe to AI
            </Link>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {cat === "all" ? "All Scenes" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Scene Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : filteredScenes.length > 0 ? (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredScenes.map(scene => (
              <Link
                key={scene.id}
                href={scene.id === "blank_canvas" 
                  ? "/wonder-build/playcanvas" 
                  : `/play/${scene.id}`}
                className="group block bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:bg-white/10 transition"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
                  {scene.thumbnail ? (
                    <img src={scene.thumbnail} alt={scene.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎮</span>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-indigo-400 transition">
                    {scene.name}
                  </h3>
                  <p className="text-white/50 text-sm mt-1 line-clamp-2">
                    {scene.description}
                  </p>
                  <span className="inline-block mt-3 text-xs text-indigo-400/70 bg-indigo-500/10 px-2 py-1 rounded">
                    {scene.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-white/40 mb-4">No scenes found in this category</p>
          <Link
            href="/game-builder/create"
            className="text-indigo-400 hover:underline"
          >
            Create one with AI instead
          </Link>
        </div>
      )}
    </div>
  );
}