'use client';

import { useState } from 'react';

interface PuckUIEngineProps {
  engineState?: any;
  onStateChange?: (state: any) => void;
}

const UI_COMPONENTS = [
  { name: 'Button', icon: '🔘', category: 'interactive', types: ['Primary', 'Secondary', 'Danger', 'Ghost'] },
  { name: 'Input', icon: '📝', category: 'interactive', types: ['Text', 'Email', 'Password', 'Search'] },
  { name: 'Select', icon: '⬇️', category: 'interactive', types: ['Dropdown', 'Multiselect', 'Combobox'] },
  { name: 'Slider', icon: '🎚️', category: 'interactive', types: ['Range', 'Dual', 'Vertical'] },
  { name: 'Card', icon: '📇', category: 'layout', types: ['Elevated', 'Outlined', 'Filled'] },
  { name: 'Modal', icon: '📦', category: 'layout', types: ['Dialog', 'Alert', 'Confirmation'] },
  { name: 'Sidebar', icon: '📊', category: 'layout', types: ['Left', 'Right', 'Collapsible'] },
  { name: 'Header', icon: '📌', category: 'layout', types: ['Fixed', 'Sticky', 'Floating'] },
  { name: 'Footer', icon: '🔗', category: 'layout', types: ['Simple', 'Multi-column', 'Minimal'] },
  { name: 'Navigation', icon: '🗺️', category: 'layout', types: ['Top Nav', 'Bottom Nav', 'Breadcrumb'] },
  { name: 'Table', icon: '📋', category: 'data', types: ['Standard', 'Striped', 'Hoverable'] },
  { name: 'List', icon: '📝', category: 'data', types: ['Ordered', 'Unordered', 'Description'] },
  { name: 'Progress', icon: '⏳', category: 'feedback', types: ['Bar', 'Circle', 'Steps'] },
  { name: 'Badge', icon: '🏷️', category: 'feedback', types: ['Dot', 'Counter', 'Label'] },
  { name: 'Toast', icon: '📢', category: 'feedback', types: ['Info', 'Success', 'Error'] },
  { name: 'Tooltip', icon: '💬', category: 'feedback', types: ['Top', 'Bottom', 'Side'] },
];

const LAYOUT_GRIDS = [
  { name: '1 Column', cols: 1 }, { name: '2 Columns', cols: 2 }, { name: '3 Columns', cols: 3 },
  { name: '4 Columns', cols: 4 }, { name: '6 Columns', cols: 6 }, { name: 'Auto Flow', cols: 0 }
];

const SPACING_PRESETS = [
  '2px', '4px', '8px', '12px', '16px', '24px', '32px', '48px', '64px'
];

const COLOR_PALETTES = [
  { name: 'Tie-Dye Neon', colors: ['#FF0055', '#000000', '#0055FF', '#00FF00', '#FFFF00'] },
  { name: 'Ocean', colors: ['#006BA6', '#0496FF', '#00C6FF', '#7FE5F0', '#E0F7FA'] },
  { name: 'Sunset', colors: ['#2E1A47', '#472B62', '#EE4266', '#FFD23F', '#3BCEAC'] },
  { name: 'Forest', colors: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'] },
  { name: 'Cyberpunk', colors: ['#0D0221', '#3A0CA3', '#7209B7', '#F72585', '#00F5FF'] },
  { name: 'Minimal', colors: ['#FFFFFF', '#F5F5F5', '#E0E0E0', '#9E9E9E', '#424242'] },
];

const TYPOGRAPHY_PRESETS = [
  { name: 'Display Large', size: '96px', weight: '300' },
  { name: 'Display', size: '57px', weight: '400' },
  { name: 'Headline Large', size: '32px', weight: '700' },
  { name: 'Headline', size: '28px', weight: '700' },
  { name: 'Title Large', size: '22px', weight: '700' },
  { name: 'Title', size: '20px', weight: '600' },
  { name: 'Body Large', size: '18px', weight: '400' },
  { name: 'Body', size: '14px', weight: '400' },
  { name: 'Label Large', size: '16px', weight: '600' },
  { name: 'Label', size: '12px', weight: '600' },
];

const ANIMATION_PRESETS = [
  { name: 'Fade In', duration: '300ms' },
  { name: 'Slide In', duration: '400ms' },
  { name: 'Scale Up', duration: '350ms' },
  { name: 'Bounce', duration: '600ms' },
  { name: 'Rotate', duration: '500ms' },
  { name: 'Pulse', duration: '1000ms' },
];

export default function PuckUIEngine({ engineState, onStateChange }: PuckUIEngineProps) {
  const [activeTab, setActiveTab] = useState<'components' | 'layout' | 'colors' | 'typography' | 'responsive'>('components');
  const [selectedCategory, setSelectedCategory] = useState<string>('interactive');

  const categories = Array.from(new Set(UI_COMPONENTS.map(c => c.category)));

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-black via-black to-black text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-magenta-500/30 p-4 bg-black/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-magenta-400">📐 Puck UI Builder</h1>
            <p className="text-sm text-white/60">Complete drag-and-drop interface designer</p>
          </div>
          <div className="flex gap-2">
            <button className="neon-button text-xs">New Layout</button>
            <button className="neon-button text-xs">Export Code</button>
            <button className="neon-button text-xs">Preview</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-48 border-r border-magenta-500/30 bg-black/30 p-4 overflow-y-auto">
          <div className="space-y-2">
            {(['components', 'layout', 'colors', 'typography', 'responsive'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  activeTab === tab
                    ? 'bg-magenta-500/30 text-magenta-300 border-l-2 border-magenta-500'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'components' && '🧩 Components'}
                {tab === 'layout' && '📐 Layout'}
                {tab === 'colors' && '🎨 Colors'}
                {tab === 'typography' && '🔤 Typography'}
                {tab === 'responsive' && '📱 Responsive'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'components' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-magenta-400">Complete Component Library</h2>
              
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {['all', ...categories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === 'all' ? 'interactive' : cat)}
                    className={`px-4 py-2 rounded text-sm transition ${
                      (cat === 'all' && selectedCategory === 'interactive') || cat === selectedCategory
                        ? 'bg-magenta-500/30 text-magenta-300'
                        : 'bg-black/30 text-white/60 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Components Grid */}
              <div className="grid grid-cols-2 gap-4">
                {UI_COMPONENTS.filter(c => c.category === selectedCategory || selectedCategory === 'all').map((component) => (
                  <div key={component.name} className="border border-magenta-500/30 rounded p-4 bg-black/50">
                    <h3 className="font-semibold text-magenta-300 mb-3">{component.icon} {component.name}</h3>
                    <div className="space-y-1 text-xs">
                      {component.types.map((type) => (
                        <button
                          key={type}
                          className="w-full text-left px-2 py-1 rounded hover:bg-magenta-500/20 transition bg-black/30"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <button className="mt-3 neon-button text-xs w-full">Add</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-blue-400">Layout Systems</h2>
              
              <div>
                <h3 className="font-semibold text-cyan-300 mb-3">Grid Layouts</h3>
                <div className="grid grid-cols-3 gap-3">
                  {LAYOUT_GRIDS.map((grid) => (
                    <button
                      key={grid.name}
                      className="border border-cyan-500/30 rounded p-4 bg-black/50 hover:bg-cyan-500/10 transition"
                    >
                      <div className="font-semibold text-cyan-300 text-sm">{grid.name}</div>
                      <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: grid.cols > 0 ? `repeat(${grid.cols}, 1fr)` : '1fr' }}>
                        {Array(grid.cols || 3).fill(0).map((_, i) => (
                          <div key={i} className="h-8 bg-cyan-500/20 rounded" />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-cyan-300 mb-3">Spacing Presets</h3>
                <div className="flex gap-2 flex-wrap">
                  {SPACING_PRESETS.map((space) => (
                    <button
                      key={space}
                      className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/40 transition"
                    >
                      {space}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-cyan-300 mb-3">Animation Presets</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ANIMATION_PRESETS.map((anim) => (
                    <button
                      key={anim.name}
                      className="text-left border border-cyan-500/30 rounded p-3 bg-black/50 hover:bg-cyan-500/10 transition"
                    >
                      <div className="font-semibold text-cyan-300 text-sm">{anim.name}</div>
                      <div className="text-xs text-white/40">{anim.duration}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-cyan-400">Color Palettes</h2>
              
              <div className="space-y-4">
                {COLOR_PALETTES.map((palette) => (
                  <div key={palette.name} className="border border-cyan-500/30 rounded p-4 bg-black/50">
                    <h3 className="font-semibold text-cyan-300 mb-3">{palette.name}</h3>
                    <div className="flex gap-2">
                      {palette.colors.map((color) => (
                        <button
                          key={color}
                          className="w-20 h-20 rounded border border-white/20 transition hover:scale-110"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-green-400">Typography System</h2>
              
              <div className="space-y-3">
                {TYPOGRAPHY_PRESETS.map((preset) => (
                  <div
                    key={preset.name}
                    className="border border-green-500/30 rounded p-4 bg-black/50"
                    style={{ fontSize: preset.size, fontWeight: preset.weight }}
                  >
                    <div className="text-white/60 text-xs mb-1">{preset.name} - {preset.size} / {preset.weight}</div>
                    <div>The quick brown fox jumps over the lazy dog</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'responsive' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-yellow-400">Responsive Design</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { breakpoint: 'Mobile', size: '320px', icon: '📱' },
                  { breakpoint: 'Tablet', size: '768px', icon: '📱' },
                  { breakpoint: 'Desktop', size: '1024px', icon: '🖥️' },
                  { breakpoint: 'Large', size: '1440px', icon: '🖥️' },
                ].map((bp) => (
                  <button
                    key={bp.breakpoint}
                    className="border border-yellow-500/30 rounded p-4 bg-black/50 hover:bg-yellow-500/10 transition text-left"
                  >
                    <div className="text-2xl mb-2">{bp.icon}</div>
                    <div className="font-semibold text-yellow-300">{bp.breakpoint}</div>
                    <div className="text-xs text-white/60">{bp.size}</div>
                  </button>
                ))}
              </div>

              <div className="border border-yellow-500/30 rounded p-4 bg-black/50">
                <h3 className="font-semibold text-yellow-300 mb-3">Responsive Settings</h3>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Mobile-first approach</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Auto-scale typography</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span>Touch-friendly spacing</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}