'use client';

import { useState } from 'react';

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'material' | 'shader';
  thumbnail: string;
  source: 'mine' | 'main-library';
}

interface Scene {
  id: string;
  name: string;
  thumbnail: string;
  lastEdited: string;
  objects: number;
}

export function UserAssetLibrary() {
  const [activeTab, setActiveTab] = useState<'scenes' | 'assets'>('scenes');
  const [myAssets, setMyAssets] = useState<Asset[]>([
    { id: '1', name: 'My Dragon Model', type: 'model', thumbnail: '🐉', source: 'mine' },
  ]);
  const [myScenes, setMyScenes] = useState<Scene[]>([
    { id: '1', name: 'Level 1 - Forest', thumbnail: '🌲', lastEdited: '2 hours ago', objects: 45 },
    { id: '2', name: 'Boss Battle Arena', thumbnail: '⚔️', lastEdited: '1 day ago', objects: 128 },
  ]);
  const [showMainLibrary, setShowMainLibrary] = useState(false);

  // Main library assets to choose from
  const mainLibraryAssets: Asset[] = [
    { id: 'm1', name: 'Dragon', type: 'model', thumbnail: '🐉', source: 'main-library' },
    { id: 'm2', name: 'Castle', type: 'model', thumbnail: '🏰', source: 'main-library' },
    { id: 'm3', name: 'Car', type: 'model', thumbnail: '🚗', source: 'main-library' },
    { id: 'm4', name: 'Gold Material', type: 'material', thumbnail: '✨', source: 'main-library' },
    { id: 'm5', name: 'Ocean Shader', type: 'shader', thumbnail: '🌊', source: 'main-library' },
  ];

  const moveToMyLibrary = (asset: Asset) => {
    const newAsset = { ...asset, id: `mine-${Date.now()}`, source: 'mine' as const };
    setMyAssets([...myAssets, newAsset]);
  };

  const loadScene = (scene: Scene) => {
    // Load scene into editor
    console.log('Loading scene:', scene.name);
  };

  const createNewScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: `New Scene ${myScenes.length + 1}`,
      thumbnail: '🆕',
      lastEdited: 'Just now',
      objects: 0,
    };
    setMyScenes([newScene, ...myScenes]);
  };

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-blue-400 mb-1">📚 My Workspace</h2>
        <p className="text-sm text-white/50">
          {myScenes.length} scenes • {myAssets.length} assets
        </p>
      </div>

      {/* Main Tabs: Scenes vs Assets */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('scenes')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
            activeTab === 'scenes'
              ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          🎬 Scenes ({myScenes.length})
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
            activeTab === 'assets'
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          📦 Assets ({myAssets.length})
        </button>
      </div>

      {/* SCENES TAB */}
      {activeTab === 'scenes' && (
        <div className="flex-1 flex flex-col">
          {/* New Scene Button */}
          <button
            onClick={createNewScene}
            className="w-full py-3 mb-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            + Create New Scene
          </button>

          {/* Scene List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {myScenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => loadScene(scene)}
                className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition group border border-transparent hover:border-blue-500/30"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{scene.thumbnail}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white group-hover:text-blue-400 transition truncate">
                      {scene.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span>{scene.objects} objects</span>
                      <span>•</span>
                      <span>{scene.lastEdited}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ASSETS TAB */}
      {activeTab === 'assets' && (
        <div className="flex-1 flex flex-col">
          {/* My Assets List */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {myAssets.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-sm">No assets yet</p>
              </div>
            ) : (
              myAssets.map((asset) => (
                <div
                  key={asset.id}
                  draggable
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-move transition group border border-transparent hover:border-purple-500/30"
                >
                  <span className="text-2xl">{asset.thumbnail}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white group-hover:text-purple-400 transition truncate">
                      {asset.name}
                    </p>
                    <p className="text-xs text-white/40 capitalize">{asset.type}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Choose from Main Library */}
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={() => setShowMainLibrary(!showMainLibrary)}
              className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {showMainLibrary ? '▼' : '▶'} Browse Main Library
            </button>

            {showMainLibrary && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                <p className="text-xs text-white/40 mb-2">Click to add to your library:</p>
                {mainLibraryAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => moveToMyLibrary(asset)}
                    className="w-full flex items-center gap-3 p-2 bg-white/5 hover:bg-green-500/10 rounded-lg transition text-left group border border-transparent hover:border-green-500/30"
                  >
                    <span className="text-xl">{asset.thumbnail}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white group-hover:text-green-400 transition truncate">
                        {asset.name}
                      </p>
                      <p className="text-[10px] text-white/40 capitalize">{asset.type}</p>
                    </div>
                    <span className="text-green-400 opacity-0 group-hover:opacity-100 transition text-lg">
                      +
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
