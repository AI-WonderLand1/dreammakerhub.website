'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface ThreeJSEngineProps {
  engineState?: any;
  onStateChange?: (state: any) => void;
}

const SCENE_OBJECTS = [
  { id: 'box', name: 'Box', category: 'primitives', icon: '▣' },
  { id: 'sphere', name: 'Sphere', category: 'primitives', icon: '●' },
  { id: 'cylinder', name: 'Cylinder', category: 'primitives', icon: '⬢' },
  { id: 'torus', name: 'Torus', category: 'primitives', icon: '◎' },
  { id: 'plane', name: 'Plane', category: 'primitives', icon: '▬' },
  { id: 'cone', name: 'Cone', category: 'primitives', icon: '▲' },
  { id: 'dodecahedron', name: 'Dodecahedron', category: 'primitives', icon: '⬡' },
  { id: 'icosahedron', name: 'Icosahedron', category: 'primitives', icon: '⬢' },
];

const GEOMETRY_MODIFIERS = [
  { name: 'Subdivide', description: 'Catmull-Clark subdivision' },
  { name: 'Extrude', description: 'Extrude faces along normals' },
  { name: 'Boolean Union', description: 'Combine with another mesh' },
  { name: 'Boolean Subtract', description: 'Cut from another mesh' },
  { name: 'Mirror', description: 'Mirror along axis' },
  { name: 'Array', description: 'Create grid/array of copies' },
  { name: 'Decimate', description: 'Reduce polygon count' },
  { name: 'Smooth', description: 'Laplacian smooth' },
];

const MATERIALS = [
  { name: 'Standard', type: 'MeshStandardMaterial', color: '#888888', roughness: 0.5, metalness: 0.0 },
  { name: 'Physical', type: 'MeshPhysicalMaterial', color: '#888888', roughness: 0.3, metalness: 0.8, clearcoat: 1.0 },
  { name: 'Toon', type: 'MeshToonMaterial', color: '#888888' },
  { name: 'Basic', type: 'MeshBasicMaterial', color: '#888888' },
  { name: 'Lambert', type: 'MeshLambertMaterial', color: '#888888' },
  { name: 'Phong', type: 'MeshPhongMaterial', color: '#888888', shininess: 100 },
  { name: 'Glass', type: 'MeshPhysicalMaterial', color: '#aaddff', roughness: 0.0, metalness: 0.0, transmission: 0.9 },
  { name: 'Emissive', type: 'MeshStandardMaterial', color: '#222222', emissive: '#ff4400', emissiveIntensity: 2.0 },
];

const POST_PROCESSING = [
  { name: 'Bloom', enabled: false, intensity: 1.5, threshold: 0.8, radius: 0.4 },
  { name: 'SSAO', enabled: false, radius: 0.5, intensity: 1.0 },
  { name: 'FXAA', enabled: false },
  { name: 'Tone Mapping', enabled: true, mode: 'ACES Filmic' },
  { name: 'Vignette', enabled: false, offset: 0.5, darkness: 0.5 },
  { name: 'Chromatic Aberration', enabled: false, offset: 0.005 },
  { name: 'Film Grain', enabled: false, intensity: 0.1 },
  { name: 'Depth of Field', enabled: false, focusDistance: 10.0, aperture: 0.025 },
];

const LIGHTING_PRESETS = [
  { name: 'Studio', ambient: 0.4, directional: 1.0, color: '#ffffff', skyColor: '#87ceeb' },
  { name: 'Sunset', ambient: 0.3, directional: 0.8, color: '#ff6b35', skyColor: '#ff7e47' },
  { name: 'Night', ambient: 0.1, directional: 0.3, color: '#4466aa', skyColor: '#0a0a2e' },
  { name: 'Forest', ambient: 0.5, directional: 0.7, color: '#88cc88', skyColor: '#2d5a27' },
  { name: 'Studio 3-Point', ambient: 0.3, directional: 1.0, color: '#ffffff', skyColor: '#1a1a2e' },
  { name: 'HDR Environment', ambient: 1.0, directional: 0.0, color: '#ffffff', skyColor: '#ffffff' },
];

const GLTF_IMPORT_SOURCES = [
  { name: 'Sketchfab', url: 'https://sketchfab.com' },
  { name: 'Poly Haven', url: 'https://polyhaven.com' },
  { name: 'Wonder 3D Studio', url: '/wonder-build/playcanvas' },
  { name: 'Khronos Sample Models', url: 'https://github.com/KhronosGroup/glTF-Sample-Models' },
  { name: 'Custom Upload', url: '' },
];

const ANIMATION_TYPES = [
  'Morph Targets', 'Skeletal Animation', 'Transform Animation',
  'Camera Animation', 'Light Animation', 'Shader Animation',
];

const CAMERA_CONTROLS = [
  { name: 'Orbit', key: 'orbit', description: 'Orbit around target' },
  { name: 'Pan', key: 'pan', description: 'Pan camera' },
  { name: 'Zoom', key: 'zoom', description: 'Zoom in/out' },
  { name: 'Fly', key: 'fly', description: 'Free-fly mode' },
  { name: 'First Person', key: 'fps', description: 'First-person navigation' },
];

export default function ThreeJSEngine({ engineState, onStateChange }: ThreeJSEngineProps) {
  const [activeTab, setActiveTab] = useState<'scene' | 'materials' | 'lighting' | 'postfx' | 'import'>('scene');
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState(0);
  const [activeCamera, setActiveCamera] = useState('orbit');
  const [sceneObjects, setSceneObjects] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [objectCount, setObjectCount] = useState(0);

  const addSceneObject = useCallback((objectId: string) => {
    const template = SCENE_OBJECTS.find(o => o.id === objectId);
    if (!template) return;
    const newObj = { id: `${objectId}-${Date.now()}`, name: template.name, type: template.category };
    setSceneObjects(prev => [...prev, newObj]);
    setObjectCount(prev => prev + 1);
  }, []);

  const removeSceneObject = useCallback((id: string) => {
    setSceneObjects(prev => prev.filter(obj => obj.id !== id));
    setObjectCount(prev => Math.max(0, prev - 1));
    if (selectedObject === id) setSelectedObject(null);
  }, [selectedObject]);

  return (
    <div className="flex h-full bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 border-r border-gray-700 flex flex-col">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {(['scene', 'materials', 'lighting', 'postfx', 'import'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {activeTab === 'scene' && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Scene Objects</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {SCENE_OBJECTS.map(obj => (
                    <button
                      key={obj.id}
                      onClick={() => addSceneObject(obj.id)}
                      className="flex items-center gap-2 p-2 bg-gray-800 rounded hover:bg-purple-600/30 text-left text-xs"
                    >
                      <span className="text-lg">{obj.icon}</span>
                      <span>{obj.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Scene Hierarchy ({objectCount})</h3>
                <div className="space-y-1">
                  {sceneObjects.map(obj => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedObject(obj.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs ${
                        selectedObject === obj.id ? 'bg-purple-600/40' : 'bg-gray-800 hover:bg-gray-750'
                      }`}
                    >
                      <span>{obj.icon || '●'} {obj.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSceneObject(obj.id); }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {sceneObjects.length === 0 && (
                    <p className="text-gray-500 text-xs italic">No objects in scene</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Geometry Modifiers</h3>
                <div className="space-y-1">
                  {GEOMETRY_MODIFIERS.map(mod => (
                    <button
                      key={mod.name}
                      className="w-full p-2 bg-gray-800 rounded hover:bg-purple-600/30 text-left text-xs"
                    >
                      <div className="font-medium">{mod.name}</div>
                      <div className="text-gray-500 text-[10px]">{mod.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Camera Controls</h3>
                <div className="space-y-1">
                  {CAMERA_CONTROLS.map(cam => (
                    <button
                      key={cam.key}
                      onClick={() => setActiveCamera(cam.key)}
                      className={`w-full p-2 rounded text-left text-xs ${
                        activeCamera === cam.key ? 'bg-purple-600/40' : 'bg-gray-800 hover:bg-gray-750'
                      }`}
                    >
                      <div className="font-medium">{cam.name}</div>
                      <div className="text-gray-500 text-[10px]">{cam.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase">Display</h3>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} className="rounded" />
                  Wireframe
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="rounded" />
                  Show Grid
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)} className="rounded" />
                  Show Axes
                </label>
              </div>
            </>
          )}

          {activeTab === 'materials' && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Material Library</h3>
                <div className="space-y-1.5">
                  {MATERIALS.map((mat, i) => (
                    <button
                      key={mat.name}
                      onClick={() => setSelectedMaterial(i)}
                      className={`w-full p-2.5 rounded text-left text-xs ${
                        selectedMaterial === i ? 'bg-purple-600/40 ring-1 ring-purple-500' : 'bg-gray-800 hover:bg-gray-750'
                      }`}
                    >
                      <div className="font-medium">{mat.name}</div>
                      <div className="text-gray-500 text-[10px]">{mat.type}</div>
                      {mat.color && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: mat.color }} />
                          <span className="text-gray-500">{mat.color}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Animation</h3>
                <div className="space-y-1">
                  {ANIMATION_TYPES.map(anim => (
                    <button
                      key={anim}
                      className="w-full p-2 bg-gray-800 rounded hover:bg-purple-600/30 text-left text-xs"
                    >
                      {anim}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'lighting' && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Lighting Presets</h3>
              <div className="space-y-2">
                {LIGHTING_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    className="w-full p-3 bg-gray-800 rounded hover:bg-purple-600/30 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: preset.color }} />
                      <span className="text-xs font-medium">{preset.name}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Ambient: {preset.ambient} | Directional: {preset.directional}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'postfx' && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Post-Processing</h3>
              <div className="space-y-2">
                {POST_PROCESSING.map(fx => (
                  <div key={fx.name} className="p-2 bg-gray-800 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{fx.name}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={fx.enabled} className="sr-only peer" />
                        <div className="w-8 h-4 bg-gray-600 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                    {fx.intensity !== undefined && (
                      <div className="mt-1.5">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Intensity</span><span>{fx.intensity}</span>
                        </div>
                        <input type="range" min="0" max="3" step="0.1" defaultValue={fx.intensity} className="w-full h-1 mt-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">GLTF Import</h3>
              <div className="space-y-2">
                <div className="p-3 bg-gray-800 rounded border-2 border-dashed border-gray-600 text-center cursor-pointer hover:border-purple-500">
                  <div className="text-2xl mb-1">📁</div>
                  <div className="text-xs text-gray-400">Drop .glb / .gltf / .obj / .fbx here</div>
                  <div className="text-[10px] text-gray-500 mt-1">or click to browse</div>
                </div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mt-3">Online Sources</h3>
                {GLTF_IMPORT_SOURCES.map(source => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-gray-800 rounded hover:bg-purple-600/30 text-xs"
                  >
                    {source.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-10 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-2">
          <span className="text-xs text-gray-400 mr-2">Three.js Editor</span>
          <div className="h-4 w-px bg-gray-700" />
          <button className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700">Play</button>
          <button className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700">Pause</button>
          <button className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700">Reset</button>
          <div className="flex-1" />
          <span className="text-[10px] text-gray-500">Objects: {objectCount}</span>
          <span className="text-[10px] text-gray-500">Camera: {activeCamera}</span>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-950 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-20">◆</div>
              <p className="text-gray-500 text-sm">Three.js Canvas</p>
              <p className="text-gray-600 text-xs mt-1">Add objects from the sidebar to begin</p>
              <p className="text-gray-700 text-[10px] mt-2">
                {sceneObjects.length > 0 ? `${sceneObjects.length} object(s) in scene` : 'Empty scene'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="h-7 bg-gray-900 border-t border-gray-700 flex items-center px-3 text-[10px] text-gray-500 gap-4">
          <span>Three.js r185</span>
          <span>WebGL2</span>
          <span>{activeCamera} camera</span>
          <span>ACES Filmic tone mapping</span>
          <div className="flex-1" />
          <span>{showGrid ? 'Grid ON' : 'Grid OFF'}</span>
          <span>{wireframe ? 'Wireframe' : 'Solid'}</span>
        </div>
      </div>
    </div>
  );
}
