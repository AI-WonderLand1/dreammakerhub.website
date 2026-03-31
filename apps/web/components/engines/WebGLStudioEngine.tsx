'use client';

import { useState } from 'react';

interface WebGLStudioEngineProps {
  engineState?: any;
  onStateChange?: (state: any) => void;
}

const SHADER_TEMPLATES = [
  { name: 'Basic Color', template: 'precision mediump float;\nvoid main() {\n  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}' },
  { name: 'Gradient', template: 'precision mediump float;\nvarying vec2 vUv;\nvoid main() {\n  gl_FragColor = vec4(vUv.x, vUv.y, 0.5, 1.0);\n}' },
  { name: 'Noise', template: 'precision mediump float;\nvarying vec2 vUv;\nfloat noise(vec2 p) {\n  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);\n}\nvoid main() {\n  gl_FragColor = vec4(vec3(noise(vUv)), 1.0);\n}' },
  { name: 'Perlin Noise', template: 'precision mediump float;\nvarying vec2 vUv;\nfloat perlin(vec3 p) {\n  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);\n}\nvoid main() {\n  gl_FragColor = vec4(vec3(perlin(vec3(vUv, 0.0))), 1.0);\n}' },
  { name: 'Mandelbrot', template: 'precision mediump float;\nvarying vec2 vUv;\nvoid main() {\n  vec2 c = vUv * 2.0 - 1.0;\n  vec2 z = vec2(0.0);\n  for(int i = 0; i < 100; i++) {\n    z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;\n  }\n  gl_FragColor = vec4(vec3(length(z) / 2.0), 1.0);\n}' },
  { name: 'Wave Simulation', template: 'precision mediump float;\nvarying vec2 vUv;\nuniform float uTime;\nvoid main() {\n  float wave = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;\n  gl_FragColor = vec4(wave, wave, wave, 1.0);\n}' },
];

const CANVAS_TOOLS = [
  { name: 'Pencil', icon: '✏️', modes: ['Free Draw', 'Smooth', 'Pressure'] },
  { name: 'Brush', icon: '🖌️', modes: ['Soft', 'Hard', 'Texture'] },
  { name: 'Shape', icon: '⬜', modes: ['Rectangle', 'Circle', 'Polygon'] },
  { name: 'Text', icon: '🔤', modes: ['Normal', 'Gradient', 'Outline'] },
  { name: 'Fill', icon: '🪣', modes: ['Solid', 'Gradient', 'Pattern'] },
  { name: 'Selection', icon: '📐', modes: ['Rectangle', 'Freehand', 'Magic Wand'] },
];

const FILTERS_LIBRARY = [
  { name: 'Blur', params: ['Radius (0-50)'] },
  { name: 'Sharpen', params: ['Amount (0-100)'] },
  { name: 'Brightness', params: ['Value (-100 to 100)'] },
  { name: 'Contrast', params: ['Value (-100 to 100)'] },
  { name: 'Saturation', params: ['Value (-100 to 100)'] },
  { name: 'Hue Shift', params: ['Angle (0-360)'] },
  { name: 'Invert', params: [] },
  { name: 'Grayscale', params: [] },
  { name: 'Sepia', params: ['Intensity (0-100)'] },
  { name: 'Color Balance', params: ['Shadows', 'Midtones', 'Highlights'] },
];

const TEXTURES_LIBRARY = [
  'Marble', 'Wood', 'Stone', 'Metal', 'Fabric', 'Glass', 'Plastic', 'Rubber',
  'Leather', 'Paper', 'Concrete', 'Brick', 'Tile', 'Water', 'Fire', 'Cloud'
];

const BLEND_MODES = [
  'Normal', 'Multiply', 'Screen', 'Overlay', 'Soft Light', 'Hard Light', 'Color Dodge',
  'Color Burn', 'Darken', 'Lighten', 'Difference', 'Exclusion', 'Hue', 'Saturation', 'Color', 'Luminosity'
];

export default function WebGLStudioEngine({ engineState, onStateChange }: WebGLStudioEngineProps) {
  const [activeTab, setActiveTab] = useState<'shaders' | 'canvas' | 'filters' | 'textures' | 'effects'>('shaders');
  const [selectedShader, setSelectedShader] = useState(SHADER_TEMPLATES[0]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-black via-black to-black text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-green-500/30 p-4 bg-black/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-400">✨ WebGL Studio</h1>
            <p className="text-sm text-white/60">Advanced shader editing & canvas graphics</p>
          </div>
          <div className="flex gap-2">
            <button className="neon-button text-xs">New Canvas</button>
            <button className="neon-button text-xs">Export</button>
            <button className="neon-button text-xs">Share</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-48 border-r border-green-500/30 bg-black/30 p-4 overflow-y-auto">
          <div className="space-y-2">
            {(['shaders', 'canvas', 'filters', 'textures', 'effects'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  activeTab === tab
                    ? 'bg-green-500/30 text-green-300 border-l-2 border-green-500'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'shaders' && '🔆 Shaders'}
                {tab === 'canvas' && '🎨 Canvas'}
                {tab === 'filters' && '🎭 Filters'}
                {tab === 'textures' && '🧩 Textures'}
                {tab === 'effects' && '✨ Effects'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'shaders' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-green-400">Shader Templates Library</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {SHADER_TEMPLATES.map((shader) => (
                  <button
                    key={shader.name}
                    onClick={() => setSelectedShader(shader)}
                    className={`text-left border rounded p-4 transition ${
                      selectedShader.name === shader.name
                        ? 'border-green-400 bg-green-500/10'
                        : 'border-green-500/30 bg-black/50 hover:border-green-400'
                    }`}
                  >
                    <div className="font-semibold text-green-300 mb-2">{shader.name}</div>
                    <code className="text-xs text-white/40 font-mono">{shader.template.substring(0, 40)}...</code>
                  </button>
                ))}
              </div>

              <div className="border border-cyan-500/30 rounded p-4 bg-black/50">
                <h3 className="font-semibold text-cyan-300 mb-3">Shader Editor</h3>
                <textarea
                  defaultValue={selectedShader.template}
                  className="w-full h-32 bg-black/50 border border-cyan-500/30 rounded p-3 text-xs font-mono text-white"
                  placeholder="Your WebGL fragment shader code..."
                />
                <button className="neon-button mt-3">Apply & Preview</button>
              </div>
            </div>
          )}

          {activeTab === 'canvas' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-blue-400">Canvas Tools</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                {CANVAS_TOOLS.map((tool) => (
                  <div key={tool.name} className="border border-cyan-500/30 rounded p-4 bg-black/50">
                    <h3 className="font-semibold text-cyan-300 mb-2">{tool.icon} {tool.name}</h3>
                    <div className="space-y-1 text-xs">
                      {tool.modes.map((mode) => (
                        <button
                          key={mode}
                          className="w-full text-left px-2 py-1 rounded hover:bg-blue-500/20 transition"
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-cyan-500/30 rounded p-4 bg-black/50">
                <h3 className="font-semibold text-cyan-300 mb-3">Blend Modes</h3>
                <div className="grid grid-cols-4 gap-2">
                  {BLEND_MODES.map((mode) => (
                    <button
                      key={mode}
                      className="px-2 py-1 text-xs rounded hover:bg-blue-500/20 transition border border-blue-500/20"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-purple-400">Filters Library</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {FILTERS_LIBRARY.map((filter) => (
                  <div key={filter.name} className="border border-purple-500/30 rounded p-4 bg-black/50">
                    <h3 className="font-semibold text-purple-300 mb-3">{filter.name}</h3>
                    {filter.params.length > 0 ? (
                      <div className="space-y-2">
                        {filter.params.map((param) => (
                          <label key={param} className="block text-sm text-white/60">
                            <span>{param}</span>
                            <input type="range" className="w-full mt-1" />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <button className="neon-button text-xs">Apply</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'textures' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-yellow-400">Texture Library</h2>
              
              <div className="grid grid-cols-4 gap-3">
                {TEXTURES_LIBRARY.map((texture) => (
                  <button
                    key={texture}
                    className="aspect-square border border-yellow-500/30 rounded bg-black/50 hover:bg-yellow-500/10 transition flex items-center justify-center text-sm font-medium hover:border-yellow-400"
                  >
                    {texture}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-pink-400">Visual Effects</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Particle System', 'Motion Blur', 'Depth of Field', 'Bloom',
                  'Chromatic Aberration', 'Vignette', 'Film Grain', 'Distortion',
                  'Glitch Effect', 'Scanlines', 'Pixelate', 'Wave Distortion'
                ].map((effect) => (
                  <button
                    key={effect}
                    className="border border-pink-500/30 rounded p-4 bg-black/50 hover:bg-pink-500/10 transition font-semibold text-pink-300"
                  >
                    {effect}
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