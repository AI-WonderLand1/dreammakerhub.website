import React from 'react';
import { FilterState, AssetCategory, AssetFormat } from '../types';
import { 
  Filter, 
  RotateCcw, 
  Check, 
  SlidersHorizontal, 
  DollarSign, 
  Box, 
  Layers, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface FilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalMatching: number;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  setFilters,
  totalMatching,
}) => {
  const categories: { id: AssetCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Assets' },
    { id: 'models', label: '3D Characters & Models' },
    { id: 'materials', label: 'Procedural PBR Shaders' },
    { id: 'environments', label: 'Environments & HDRIs' },
    { id: 'vfx', label: 'Niagara VFX Particles' },
    { id: 'building_kits', label: 'Modular Building Kits' },
    { id: 'audio', label: 'Sound FX Audio' },
  ];

  const availableFormats: AssetFormat[] = ['.GLTF', '.FBX', '.OBJ', '.BLEND', '.UNREAL', '.UNITY', '.4K_PBR'];

  const toggleFormat = (fmt: AssetFormat) => {
    sounds.playClick();
    setFilters((prev) => {
      const exists = prev.formats.includes(fmt);
      return {
        ...prev,
        formats: exists ? prev.formats.filter((f) => f !== fmt) : [...prev.formats, fmt],
      };
    });
  };

  const resetFilters = () => {
    sounds.playClick();
    setFilters({
      search: '',
      category: 'all',
      formats: [],
      maxPrice: 100,
      freeOnly: false,
      maxPolyCount: 200000,
      pbrOnly: false,
      riggedOnly: false,
      animatedOnly: false,
      sortBy: 'trending',
    });
  };

  return (
    <aside className="w-full lg:w-64 border border-white/5 lg:border-r lg:border-t-0 lg:border-b-0 lg:border-l-0 bg-black/20 p-6 flex flex-col gap-6 shrink-0 rounded-2xl lg:rounded-none backdrop-blur-md">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">
            Filters
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-mono border border-cyan-500/20">
            {totalMatching}
          </span>
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Reset All Filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By Selector */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold block">
          Sort Order
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => {
            sounds.playClick();
            setFilters((p) => ({ ...p, sortBy: e.target.value as FilterState['sortBy'] }));
          }}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
        >
          <option value="trending" className="bg-zinc-900">🔥 Trending & Popular</option>
          <option value="rating" className="bg-zinc-900">★ Highest Rated</option>
          <option value="newest" className="bg-zinc-900">✨ Newest Arrivals</option>
          <option value="price_low" className="bg-zinc-900">💲 Price: Low to High</option>
          <option value="price_high" className="bg-zinc-900">💎 Price: High to Low</option>
          <option value="polyCount" className="bg-zinc-900">📐 Polycount: Low to High</option>
        </select>
      </div>

      {/* Categories Section */}
      <div className="space-y-2">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-bold">Categories</h3>
        <ul className="space-y-1">
          {categories.map((cat) => {
            const isSelected = filters.category === cat.id;
            return (
              <li key={cat.id}>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setFilters((p) => ({ ...p, category: cat.id }));
                  }}
                  className={`w-full text-left text-sm transition-all ${
                    isSelected
                      ? 'text-cyan-400 flex items-center gap-2.5 bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/20 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 p-2 rounded-lg hover:bg-white/5 transition-colors'
                  }`}
                >
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)] shrink-0" />
                  )}
                  <span className="truncate">{cat.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* File Formats Pills */}
      <div className="space-y-2 border-t border-white/5 pt-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">3D Formats</h3>
        <div className="flex flex-wrap gap-1.5">
          {availableFormats.map((fmt) => {
            const isSelected = filters.formats.includes(fmt);
            return (
              <button
                key={fmt}
                onClick={() => toggleFormat(fmt)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-zinc-200'
                }`}
              >
                {fmt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-3 border-t border-white/5 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
            Max Price
          </label>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {filters.freeOnly ? 'FREE ONLY' : `$${filters.maxPrice}`}
          </span>
        </div>

        {!filters.freeOnly && (
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.maxPrice}
              onChange={(e) => setFilters((p) => ({ ...p, maxPrice: parseInt(e.target.value) }))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={filters.freeOnly}
            onChange={(e) => {
              sounds.playClick();
              setFilters((p) => ({ ...p, freeOnly: e.target.checked }));
            }}
            className="accent-cyan-500 cursor-pointer"
          />
          <span className="text-xs text-zinc-400">Free Assets Only</span>
        </label>
      </div>

      {/* Polycount Slider */}
      <div className="space-y-2 border-t border-white/5 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
            Poly Count
          </label>
          <span className="text-xs font-mono text-cyan-400">
            {filters.maxPolyCount >= 200000 ? 'Any' : `< ${(filters.maxPolyCount / 1000).toFixed(0)}k`}
          </span>
        </div>

        <input
          type="range"
          min="5000"
          max="200000"
          step="10000"
          value={filters.maxPolyCount}
          onChange={(e) => setFilters((p) => ({ ...p, maxPolyCount: parseInt(e.target.value) }))}
          className="w-full accent-cyan-500 cursor-pointer"
        />
      </div>

      {/* Tech Specifications */}
      <div className="space-y-3 border-t border-white/5 pt-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">Technical Specs</h3>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.pbrOnly}
              onChange={(e) => {
                sounds.playClick();
                setFilters((p) => ({ ...p, pbrOnly: e.target.checked }));
              }}
              className="accent-cyan-500 cursor-pointer"
            />
            <span className="text-xs text-zinc-400">PBR Ready</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.riggedOnly}
              onChange={(e) => {
                sounds.playClick();
                setFilters((p) => ({ ...p, riggedOnly: e.target.checked }));
              }}
              className="accent-cyan-500 cursor-pointer"
            />
            <span className="text-xs text-zinc-400">Rigged Skeleton</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.animatedOnly}
              onChange={(e) => {
                sounds.playClick();
                setFilters((p) => ({ ...p, animatedOnly: e.target.checked }));
              }}
              className="accent-cyan-500 cursor-pointer"
            />
            <span className="text-xs text-zinc-400">Animated only</span>
          </label>
        </div>
      </div>

    </aside>
  );
};
