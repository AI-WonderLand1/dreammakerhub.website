'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { AssetPicker } from "@/components/engines/AssetPicker";
import { UserAssetLibrary } from "@/components/engines/UserAssetLibrary";
import { CharacterGenerator } from "@/components/ai/CharacterGenerator";
import { GLTFUploader } from "@/components/ai/GLTFUploader";

interface Scene {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  user_id?: string;
  created_at: string;
  updated_at: string;
  data?: any;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [createTab, setCreateTab] = useState<string>("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");

  useEffect(() => {
    fetchScenes();
  }, [filter]);

  const fetchScenes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scenes/templates`);
      const data = await response.json();
      
      if (data.templates) {
        // Filter scenes based on selection
        let filteredScenes = data.templates;
        
        if (filter === "ai-generated") {
          filteredScenes = data.templates.filter((scene: any) => 
            scene.id.includes("template_") || scene.category === "ai-generated"
          );
        } else if (filter === "user-created") {
          filteredScenes = data.templates.filter((scene: any) => 
            scene.user_id && scene.user_id !== "system"
          );
        } else if (filter === "external" || filter === "my-downloads") {
          filteredScenes = [];
        }
        
        setScenes(filteredScenes);
      }
    } catch (error) {
      console.error("Failed to fetch scenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScenePreviewUrl = (sceneId: string) => {
    return `/wonder-build/playcanvas/editor/${sceneId}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sci-fi": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "nature": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "fantasy": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "space": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "city": return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      case "ai-generated": return "bg-pink-500/20 text-pink-300 border-pink-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-extrabold tracking-tight text-white">
              AI Wonderland
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <h1 className="text-xl font-bold">Scene Library</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/wonder-build/playcanvas/editor/blank_canvas"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold hover:scale-105 transition-transform"
            >
              🎨 Start 3D Editor
            </Link>
            <Link
              href="?tab=create"
              className="px-4 py-2 border border-white/20 bg-white/5 rounded-lg text-white hover:bg-white/10 transition"
            >
              ✨ Create Character
            </Link>
            {user && (
              <Link 
                href="/dashboard/projects" 
                className="px-4 py-2 border border-white/20 bg-white/5 rounded-lg text-white hover:bg-white/10 transition"
              >
                My Projects
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all" 
                ? "bg-white/10 text-white" 
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            All Scenes
          </button>
          <button
            onClick={() => setFilter("ai-generated")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "ai-generated" 
                ? "bg-pink-500/20 text-pink-300" 
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            🤖 AI Generated
          </button>
          <button
            onClick={() => setFilter("user-created")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "user-created" 
                ? "bg-blue-500/20 text-blue-300" 
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            👤 User Created
          </button>
          <button
            onClick={() => setFilter("external")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "external" 
                ? "bg-green-500/20 text-green-300" 
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            🌐 External Libs
          </button>
          <button
            onClick={() => setFilter("my-downloads")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "my-downloads" 
                ? "bg-purple-500/20 text-purple-300" 
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            📥 My Downloads
          </button>
        </div>

        {filter === "external" && (
          <div className="mb-6">
            <AssetPicker />
          </div>
        )}

        {filter === "my-downloads" && (
          <div className="mb-6">
            <UserAssetLibrary />
          </div>
        )}

        {filter === "all" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <CharacterGenerator onGenerate={(desc) => console.log("Generated:", desc)} />
            <GLTFUploader onUpload={(url, name) => setUploadedUrl(url)} />
          </div>
        )}

        {/* Scene Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/10 rounded-xl h-48 mb-3"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : scenes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="text-xl font-semibold mb-2">No scenes yet</h3>
            <p className="text-white/60 mb-6">Be the first to create a scene!</p>
            <Link
              href="/wonder-build/playcanvas/editor/blank_canvas"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold hover:scale-105 transition-transform"
            >
              🎨 Start 3D Editor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scenes.map((scene) => (
              <Link
                key={scene.id}
                href={getScenePreviewUrl(scene.id)}
                className="group block bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/30 hover:bg-white/10 transition-all"
              >
                {/* Scene Preview Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-4xl">
                    {scene.category === "sci-fi" ? "🏙️" : 
                     scene.category === "nature" ? "🏝️" : 
                     scene.category === "fantasy" ? "🏰" : 
                     scene.category === "space" ? "🚀" : 
                     "🎨"}
                  </span>
                </div>
                
                {/* Scene Info */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {scene.name}
                    </h3>
                    {scene.category && (
                      <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(scene.category)}`}>
                        {scene.category}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-white/60 line-clamp-2 mb-3">
                    {scene.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>
                      {scene.created_at 
                        ? new Date(scene.created_at).toLocaleDateString()
                        : "Recently added"
                      }
                    </span>
                    <span className="group-hover:text-purple-400 transition-colors">
                      Open →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-white/10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to create something amazing?</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Use our Wonderbuild AI to describe what you want and watch as intelligent agents create it for you.
          </p>
          <Link 
            href="/wonder-build/ai-builder" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold hover:scale-105 transition-transform"
          >
            🤖 Start Wonderbuild
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}