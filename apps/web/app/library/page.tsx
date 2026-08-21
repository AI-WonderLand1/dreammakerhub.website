'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { AssetPicker } from "@/components/engines/AssetPicker";
import { UserAssetLibrary } from "@/components/engines/UserAssetLibrary";
import { CharacterGenerator } from "@/components/ai/CharacterGenerator";
import { GLTFUploader } from "@/components/ai/GLTFUploader";
import { logger } from '@/lib/logger';

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

interface NPCAsset {
  id: string;
  name: string;
  description: string;
  type: 'humanoid' | 'creature' | 'vehicle' | 'prop';
  personality: string[];
  thumbnail: string;
  tags: string[];
  previewImages: string[];
  stats: {
    health: number;
    speed: number;
    intelligence: number;
    combat: number;
  };
  aiConfig: {
    behaviorTree: string;
    perceptionRange: number;
    decisionInterval: number;
  };
}

const NPC_ASSETS: NPCAsset[] = [
  {
    id: "guardian",
    name: "Guardian Knight",
    description: "A loyal protector with tactical combat AI. Patrols areas, defends allies, and engages threats intelligently.",
    type: "humanoid",
    personality: ["Brave", "Loyal", "Tactical", "Protective"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=guardian-knight&backgroundColor=3b82f6,1e40af",
    tags: ["Combat", "Patrol", "Teamplay"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=guardian-knight-1&backgroundColor=3b82f6",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=guardian-knight-2&backgroundColor=1e40af",
    ],
    stats: { health: 100, speed: 5, intelligence: 7, combat: 9 },
    aiConfig: { behaviorTree: "GuardianPatrol", perceptionRange: 15, decisionInterval: 500 }
  },
  {
    id: "merchant",
    name: "Wandering Merchant",
    description: "An intelligent trader who evaluates player inventory, offers dynamic pricing, and remembers past transactions.",
    type: "humanoid",
    personality: ["Cunning", "Friendly", "Opportunistic", "Memorable"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=wandering-merchant&backgroundColor=f59e0b,d97706",
    tags: ["Trading", "Economy", "Dialogue"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=wandering-merchant-1&backgroundColor=f59e0b",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=wandering-merchant-2&backgroundColor=d97706",
    ],
    stats: { health: 50, speed: 4, intelligence: 9, combat: 2 },
    aiConfig: { behaviorTree: "MerchantTrade", perceptionRange: 10, decisionInterval: 1000 }
  },
  {
    id: "beast",
    name: "Shadow Beast",
    description: "A territorial predator with pack hunting AI. Coordinates with allies, flanks prey, and adapts to player tactics.",
    type: "creature",
    personality: ["Aggressive", "Cunning", "Territorial", "Pack-oriented"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=shadow-beast&backgroundColor=ef4444,dc2626",
    tags: ["Combat", "Hunting", "Stealth"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=shadow-beast-1&backgroundColor=ef4444",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=shadow-beast-2&backgroundColor=dc2626",
    ],
    stats: { health: 80, speed: 8, intelligence: 6, combat: 8 },
    aiConfig: { behaviorTree: "PredatorHunt", perceptionRange: 20, decisionInterval: 300 }
  },
  {
    id: "drone",
    name: "Scout Drone",
    description: "Autonomous aerial unit with computer vision. Surveys areas, detects threats, and relays tactical data.",
    type: "vehicle",
    personality: ["Vigilant", "Precise", "Relentless", "Efficient"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=scout-drone&backgroundColor=8b5cf6,7c3aed",
    tags: ["Recon", "Vision", "Support"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=scout-drone-1&backgroundColor=8b5cf6",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=scout-drone-2&backgroundColor=7c3aed",
    ],
    stats: { health: 40, speed: 12, intelligence: 8, combat: 3 },
    aiConfig: { behaviorTree: "DroneSurvey", perceptionRange: 30, decisionInterval: 200 }
  },
  {
    id: "villager",
    name: "Village Elder",
    description: "Wise NPC with dynamic dialogue system. Offers quests, shares lore, and reacts to world state changes.",
    type: "humanoid",
    personality: ["Wise", "Compassionate", "Knowledgeable", "Patient"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=village-elder&backgroundColor=22c55e,16a34a",
    tags: ["Quest", "Dialogue", "Lore"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=village-elder-1&backgroundColor=22c55e",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=village-elder-2&backgroundColor=16a34a",
    ],
    stats: { health: 60, speed: 3, intelligence: 10, combat: 1 },
    aiConfig: { behaviorTree: "ElderDialogue", perceptionRange: 8, decisionInterval: 2000 }
  },
  {
    id: "sentry",
    name: "Automated Sentry",
    description: "Stationary defense unit with threat assessment AI. Identifies targets, prioritizes threats, and coordinates with network.",
    type: "prop",
    personality: ["Vigilant", "Ruthless", "Calculating", "Networked"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=automated-sentry&backgroundColor=6b7280,4b5563",
    tags: ["Defense", "Surveillance", "Automation"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=automated-sentry-1&backgroundColor=6b7280",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=automated-sentry-2&backgroundColor=4b5563",
    ],
    stats: { health: 120, speed: 0, intelligence: 7, combat: 9 },
    aiConfig: { behaviorTree: "SentryDefense", perceptionRange: 25, decisionInterval: 100 }
  }
];

export default function LibraryPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const sendTo = searchParams.get('sendTo');
  const projectId = searchParams.get('projectId');
  
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
        let filteredScenes = data.templates;
        
        if (filter === "ai-generated") {
          filteredScenes = data.templates.filter((scene: any) => 
            scene.id.includes("template_") || scene.category === "ai-generated"
          );
        } else if (filter === "user-created") {
          filteredScenes = data.templates.filter((scene: any) => 
            scene.user_id && scene.user_id !== "system"
          );
        } else if (filter === "external" || filter === "my-downloads" || filter === "npc-assets") {
          filteredScenes = [];
        }
        
        setScenes(filteredScenes);
      }
    } catch (error) {
      logger.error("Failed to fetch scenes:", error);
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

  const getNPCTypeColor = (type: NPCAsset['type']) => {
    switch (type) {
      case "humanoid": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "creature": return "bg-red-500/20 text-red-300 border-red-500/30";
      case "vehicle": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "prop": return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const handleSendToBuilder = (asset: NPCAsset) => {
    if (projectId) {
      window.location.href = `/wonder-build/builder?projectId=${projectId}&importNPC=${asset.id}`;
    } else {
      window.location.href = `/wonder-build/builder?importNPC=${asset.id}`;
    }
  };

  const handleSendTo3DPod = (asset: NPCAsset) => {
    window.location.href = `/dashboard/3dhub?importNPC=${asset.id}`;
  };

  const handleSendSceneToBuilder = (sceneId: string) => {
    if (projectId) {
      window.location.href = `/wonder-build/builder?projectId=${projectId}&importScene=${sceneId}`;
    } else {
      window.location.href = `/wonder-build/builder?importScene=${sceneId}`;
    }
  };

  const handleSendSceneTo3DPod = (sceneId: string) => {
    window.location.href = `/dashboard/3dhub?importScene=${sceneId}`;
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
            <h1 className="text-xl font-bold">Asset Library</h1>
            {sendTo && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30">
                Select asset to send → {sendTo === 'builder' ? '🎨 Builder' : '🎮 3D Pod'}
              </span>
            )}
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
        <div className="flex gap-2 mb-6 flex-wrap">
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
          <button
            onClick={() => setFilter("npc-assets")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "npc-assets" 
                ? "bg-cyan-500/20 text-cyan-300" 
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            🤖 NPC Assets (AI Sim)
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
            <CharacterGenerator onGenerate={(desc) => logger.info("Generated:", desc)} />
            <GLTFUploader onUpload={(url, name) => setUploadedUrl(url)} />
          </div>
        )}

        {/* NPC Assets Grid */}
        {filter === "npc-assets" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {NPC_ASSETS.map((asset) => (
              <div
                key={asset.id}
                className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/30 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => sendTo === 'builder' ? handleSendToBuilder(asset) : sendTo === 'pod' ? handleSendTo3DPod(asset) : window.location.href = `/dashboard/3dhub?importNPC=${asset.id}`}
              >
                <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {asset.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getNPCTypeColor(asset.type)} capitalize`}>
                      {asset.type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white/60 line-clamp-2 mb-3">
                    {asset.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {asset.personality.slice(0, 3).map((trait) => (
                      <span key={trait} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs rounded-full font-medium">
                        {trait}
                      </span>
                    ))}
                    {asset.personality.length > 3 && (
                      <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded-full font-medium">
                        +{asset.personality.length - 3}
                      </span>
                    )}
                  </div>

                  {sendTo && (
                    <div className="flex gap-2 pt-3 border-t border-white/10">
                      <button
                        onClick={(e) => { e.stopPropagation(); sendTo === 'builder' ? handleSendToBuilder(asset) : handleSendTo3DPod(asset); }}
                        className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-semibold text-sm hover:from-cyan-500 hover:to-blue-500 transition-all"
                      >
                        {sendTo === 'builder' ? '🎨 Send to Builder' : '🎮 Send to 3D Pod'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); sendTo === 'builder' ? handleSendTo3DPod(asset) : handleSendToBuilder(asset); }}
                        className="px-3 py-2 border border-white/20 bg-white/5 rounded-lg text-white hover:bg-white/10 transition text-sm"
                      >
                        {sendTo === 'builder' ? '🎮' : '🎨'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scene Grid */}
        {filter !== "npc-assets" && (
          <>
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
                  <div
                    key={scene.id}
                    className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/30 hover:bg-white/10 transition-all"
                  >
                    <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-4xl">
                        {scene.category === "sci-fi" ? "🏙️" : 
                         scene.category === "nature" ? "🏝️" : 
                         scene.category === "fantasy" ? "🏰" : 
                         scene.category === "space" ? "🚀" : 
                         "🎨"}
                      </span>
                    </div>
                    
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
                      
                      <div className="flex items-center justify-between text-xs text-white/40 mb-2">
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

                      {sendTo && (
                        <div className="flex gap-2 pt-3 border-t border-white/10">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendSceneToBuilder(scene.id); }}
                            className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all"
                          >
                            🎨 Send to Builder
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendSceneTo3DPod(scene.id); }}
                            className="px-3 py-2 border border-white/20 bg-white/5 rounded-lg text-white hover:bg-white/10 transition text-sm"
                          >
                            🎮
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-white/10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to create something amazing?</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Browse NPCs with AI behaviors, voice configs, and personality traits — then send them to the Builder or 3D Pod.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/wonder-build/builder" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold hover:scale-105 transition-transform"
            >
              🎨 Open Builder
              <span className="text-lg">→</span>
            </Link>
            <Link 
              href="/dashboard/3dhub" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-semibold hover:scale-105 transition-transform"
            >
              🎮 Open 3D Pod
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}