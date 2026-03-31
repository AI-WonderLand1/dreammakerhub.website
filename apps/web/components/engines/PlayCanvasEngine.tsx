'use client';

import { useState } from 'react';

interface PlayCanvasEngineProps {
  engineState?: any;
  onStateChange?: (state: any) => void;
}

interface ModelLibraryItem {
  id: string;
  name: string;
  category: string;
  url: string;
}

interface Asset3D {
  name: string;
  type: 'model' | 'material' | 'skybox' | 'particle' | 'shader';
  libraries: string[];
}

const MODEL_LIBRARY: ModelLibraryItem[] = [
  // Characters
  { id: 'char-humanoid', name: 'Humanoid', category: 'characters', url: 'models/characters/humanoid' },
  { id: 'char-robot', name: 'Robot', category: 'characters', url: 'models/characters/robot' },
  { id: 'char-alien', name: 'Alien', category: 'characters', url: 'models/characters/alien' },
  { id: 'char-animal', name: 'Animal Rig', category: 'characters', url: 'models/characters/animal' },
  
  // Environment
  { id: 'env-castle', name: 'Castle', category: 'environments', url: 'models/env/castle' },
  { id: 'env-city', name: 'City Block', category: 'environments', url: 'models/env/city' },
  { id: 'env-forest', name: 'Forest', category: 'environments', url: 'models/env/forest' },
  { id: 'env-island', name: 'Island', category: 'environments', url: 'models/env/island' },
  
  // Props
  { id: 'prop-chair', name: 'Chair', category: 'props', url: 'models/props/chair' },
  { id: 'prop-table', name: 'Table', category: 'props', url: 'models/props/table' },
  { id: 'prop-door', name: 'Door', category: 'props', url: 'models/props/door' },
  { id: 'prop-weapon', name: 'Weapon', category: 'props', url: 'models/props/weapon' },
  
  // Vehicles
  { id: 'vehicle-car', name: 'Car', category: 'vehicles', url: 'models/vehicles/car' },
  { id: 'vehicle-truck', name: 'Truck', category: 'vehicles', url: 'models/vehicles/truck' },
  { id: 'vehicle-bike', name: 'Motorcycle', category: 'vehicles', url: 'models/vehicles/bike' },
  { id: 'vehicle-aircraft', name: 'Aircraft', category: 'vehicles', url: 'models/vehicles/aircraft' },
];

const MATERIALS_LIBRARY = [
  { name: 'Metal - Polished', preset: 'metal-polished', roughness: 0.3, metallic: 1.0 },
  { name: 'Metal - Brushed', preset: 'metal-brushed', roughness: 0.6, metallic: 1.0 },
  { name: 'Rock - Granite', preset: 'rock-granite', roughness: 0.8, metallic: 0 },
  { name: 'Fabric - Cotton', preset: 'fabric-cotton', roughness: 0.9, metallic: 0 },
  { name: 'Glass - Clear', preset: 'glass-clear', roughness: 0.0, metallic: 0 },
  { name: 'Wood - Oak', preset: 'wood-oak', roughness: 0.7, metallic: 0 },
  { name: 'Plastic - Glossy', preset: 'plastic-glossy', roughness: 0.4, metallic: 0 },
  { name: 'Gold', preset: 'gold', roughness: 0.2, metallic: 1.0 },
];

const ANIMATION_TYPES = [
  'Idle', 'Walk', 'Run', 'Jump', 'Attack', 'Damage', 'Death', 'Celebrate',
  'Dance', 'Sit', 'Stand', 'Crouch', 'Lean', 'Wave', 'Talk', 'Custom'
];

const PHYSICS_COMPONENTS = [
  'Rigidbody', 'BoxCollider', 'SphereCollider', 'CapsuleCollider', 'CharacterController',
  'Joint', 'Hinge', 'Spring', 'Friction', 'Gravity', 'Trigger'
];

const LIGHTING_OPTIONS = [
  { name: 'Directional', icon: '☀️', types: ['Sun', 'Moon'] },
  { name: 'Point Light', icon: '💡', types: ['Standard', 'Coloured', 'HDR'] },
  { name: 'Spotlight', icon: '🔦', types: ['Focused', 'Soft'] },
  { name: 'Area Light', icon: '📦', types: ['Rectangular', 'Disc'] },
];

const SKYBOX_LIBRARY = [
  'Sunny Sky', 'Cloudy Day', 'Sunset', 'Starfield', 'Nebula', 'Urban', 'Forest', 'Ocean', 'Space Station'
];

export default function PlayCanvasEngine({ engineState, onStateChange }: PlayCanvasEngineProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'scene' | 'physics' | 'lighting' | 'materials'>('library');
  const [selectedModel, setSelectedModel] = useState<ModelLibraryItem | null>(null);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-black via-black to-black text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-cyan-500/30 p-4 bg-black/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">🎮 PlayCanvas 3D Engine</h1>
            <p className="text-sm text-white/60">Full 3D game development with physics, animation & lighting</p>
          </div>
          <div className="flex gap-2">
            <button className="neon-button text-xs">Create Scene</button>
            <button className="neon-button text-xs">Import Model</button>
            <button className="neon-button text-xs">Publish</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-48 border-r border-cyan-500/30 bg-black/30 p-4 overflow-y-auto">
          <div className="space-y-2">
            {(['library', 'scene', 'physics', 'lighting', 'materials'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  activeTab === tab
                    ? 'bg-blue-500/30 text-blue-300 border-l-2 border-blue-500'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'library' && '📚 Model Library'}
                {tab === 'scene' && '🎬 Scene Setup'}
                {tab === 'physics' && '⚛️ Physics'}
                {tab === 'lighting' && '💡 Lighting'}
                {tab === 'materials' && '🎨 Materials'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'library' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-green-400">Complete 3D Model Library</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {['characters', 'environments', 'props', 'vehicles'].map((category) => (
                  <div key={category} className="border border-cyan-500/30 rounded p-4 bg-black/50">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-3 capitalize">{category}</h3>
                    <ul className="space-y-2">
                      {MODEL_LIBRARY.filter(m => m.category === category).map((model) => (
                        <li key={model.id}>
                          <button
                            onClick={() => setSelectedModel(model)}
                            className="w-full text-left px-3 py-2 rounded hover:bg-blue-500/20 transition text-sm"
                          >
                            {model.name}
                            <span className="float-right text-xs text-white/40">+</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {selectedModel && (
                <div className="border border-green-500/50 rounded p-4 bg-green-500/10">
                  <h3 className="font-semibold text-green-300 mb-2">Selected: {selectedModel.name}</h3>
                  <p className="text-sm text-white/60 mb-3">Location: {selectedModel.url}</p>
                  <button className="neon-button">Add to Scene</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scene' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-yellow-400">Scene Management</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-cyan-500/30 rounded p-4 bg-black/50">
                  <h3 className="font-semibold text-cyan-300 mb-3">Animations</h3>
                  <div className="space-y-2">
                    {ANIMATION_TYPES.slice(0, 8).map((anim) => (
                      <button
                        key={anim}
                        className="w-full text-left px-3 py-1 text-sm rounded hover:bg-blue-500/20 transition"
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-cyan-500/30 rounded p-4 bg-black/50">
                  <h3 className="font-semibold text-cyan-300 mb-3">Skyboxes</h3>
                  <div className="space-y-2">
                    {SKYBOX_LIBRARY.slice(0, 8).map((sky) => (
                      <button
                        key={sky}
                        className="w-full text-left px-3 py-1 text-sm rounded hover:bg-purple-500/20 transition"
                      >
                        {sky}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-red-400">Physics Components</h2>
              
              <div className="grid grid-cols-3 gap-4">
                {PHYSICS_COMPONENTS.map((component) => (
                  <button
                    key={component}
                    className="border border-red-500/30 rounded p-4 bg-black/50 hover:bg-red-500/10 transition text-center"
                  >
                    <div className="font-semibold text-red-300">{component}</div>
                    <div className="text-xs text-white/40 mt-1">Click to add</div>
                  </button>
                ))}
              </div>

              <div className="border border-cyan-500/30 rounded p-4 bg-black/50">
                <h3 className="font-semibold text-cyan-300 mb-3">Physics Settings</h3>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Enable Gravity</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Enable Collision</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span>Use Soft Bodies</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lighting' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-yellow-400">Lighting System</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {LIGHTING_OPTIONS.map((light) => (
                  <div key={light.name} className="border border-yellow-500/30 rounded p-4 bg-black/50">
                    <h3 className="font-semibold text-yellow-300 mb-3">{light.icon} {light.name}</h3>
                    <div className="space-y-2">
                      {light.types.map((type) => (
                        <button
                          key={type}
                          className="w-full text-left px-3 py-1 text-sm rounded hover:bg-yellow-500/20 transition"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-purple-400">Material Library</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {MATERIALS_LIBRARY.map((material) => (
                  <button
                    key={material.preset}
                    className="border border-purple-500/30 rounded p-4 bg-black/50 hover:bg-purple-500/10 transition text-left"
                  >
                    <div className="font-semibold text-purple-300">{material.name}</div>
                    <div className="text-xs text-white/60 mt-2">
                      Roughness: {material.roughness.toFixed(1)} | Metallic: {material.metallic.toFixed(1)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
