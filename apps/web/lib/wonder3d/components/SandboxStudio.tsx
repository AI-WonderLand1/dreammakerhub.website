'use client';
import React, { useState } from 'react';
import { AssetItem, Model3DType, ViewportLighting } from '../types';
import { ThreeViewport } from './ThreeViewport';
import { 
  Wand2, 
  Image as ImageIcon, 
  Palette, 
  Film, 
  Sparkles, 
  Sliders, 
  Layers, 
  Box, 
  Maximize, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  History, 
  RotateCw, 
  Zap, 
  Check, 
  Sun, 
  Activity,
  Cpu,
  RefreshCw,
  Scissors,
  Bone,
  Flame,
  FileCode,
  Share2,
  Trash2,
  Loader2
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface SandboxStudioProps {
  availableAssets: AssetItem[];
  initialAsset?: AssetItem | null;
}

type GenerationMode = 'text_to_3d' | 'image_to_3d' | 'ai_texture' | 'animate';

interface HistoryItem {
  id: string;
  title: string;
  prompt: string;
  mode: GenerationMode;
  polyCount: number;
  format: string;
  fileSize: string;
  timestamp: string;
  modelType: Model3DType;
  primaryColor: string;
  thumbnailUrl: string;
}

export const SandboxStudio: React.FC<SandboxStudioProps> = ({
  availableAssets,
  initialAsset,
}) => {
  // Active selected asset / generation
  const [activeAsset, setActiveAsset] = useState<AssetItem>(
    initialAsset || availableAssets[0] || {
      id: 'gen-001',
      title: 'Aether Cyber Mech',
      description: 'AI Generated high-fidelity hard-surface cybernetic unit.',
      category: 'models',
      tags: ['Cyberpunk', 'Mech', 'HardSurface'],
      creator: {
        id: 'c-1',
        name: 'OmniAI Engine',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
        badge: 'AI Core',
        rating: 5.0,
        sales: 1420,
        verified: true,
      },
      price: 0,
      rating: 4.9,
      reviewsCount: 48,
      downloadCount: 312,
      likesCount: 189,
      viewsCount: 1240,
      dateAdded: '2026-08-08',
      formats: ['.GLTF', '.FBX', '.USDZ'],
      modelType: 'mech',
      thumbnailImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      isAiGenerated: true,
      licenseType: 'Standard',
      previewBgGradient: 'from-cyan-950 via-slate-900 to-black',
      primaryColor: '#00F0FF',
      specs: {
        polyCount: 48500,
        vertexCount: 52100,
        meshCount: 1,
        textureResolution: '4K PBR',
        rigged: true,
        animated: true,
        pbrReady: true,
        uvUnwrapped: true,
        fileSizeMB: 28.4,
        engineCompatibility: ['Unreal 5', 'Unity', 'Three.js'],
      },
      reviews: [],
    }
  );

  // Left Rail Generation Mode & Form State
  const [activeMode, setActiveMode] = useState<GenerationMode>('text_to_3d');
  const [prompt, setPrompt] = useState<string>(
    'Futuristic exoskeleton combat suit with glowing neon cyan power conduits and metallic titanium plating'
  );
  const [artStyle, setArtStyle] = useState<string>('cyberpunk');
  const [detailLevel, setDetailLevel] = useState<'ultra' | 'high' | 'mobile'>('high');
  const [textureRes, setTextureRes] = useState<'1K' | '2K' | '4K'>('4K');
  const [enableSymmetry, setEnableSymmetry] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  // Viewport Settings
  const [lighting, setLighting] = useState<ViewportLighting>('cyberpunk');
  const [primaryColor, setPrimaryColor] = useState<string>(activeAsset.primaryColor || '#00F0FF');
  const [activePostAction, setActivePostAction] = useState<string | null>(null);

  // Right Collapsible Drawer State
  const [historyOpen, setHistoryOpen] = useState<boolean>(true);

  // Generation History State
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 'hist-1',
      title: 'Quantum Core Reactor',
      prompt: 'Floating plasma reactor with dark matter ring stabilizer',
      mode: 'text_to_3d',
      polyCount: 32400,
      format: 'GLB',
      fileSize: '18.2 MB',
      timestamp: '2 mins ago',
      modelType: 'quantum_core',
      primaryColor: '#A855F7',
      thumbnailUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 'hist-2',
      title: 'Crystal Matrix Shard',
      prompt: 'Refractive emerald gemstone with glowing interior facets',
      mode: 'image_to_3d',
      polyCount: 18900,
      format: 'FBX',
      fileSize: '9.4 MB',
      timestamp: '15 mins ago',
      modelType: 'crystal',
      primaryColor: '#10B981',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 'hist-3',
      title: 'Portal VFX Ring',
      prompt: 'Hyperspace jump portal with particle swirl field',
      mode: 'ai_texture',
      polyCount: 54100,
      format: 'USDZ',
      fileSize: '31.0 MB',
      timestamp: '1 hour ago',
      modelType: 'portal_vfx',
      primaryColor: '#EC4899',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 'hist-4',
      title: 'Hover Drone Sentinel',
      prompt: 'Tactical stealth drone with camera optics array',
      mode: 'animate',
      polyCount: 62000,
      format: 'GLTF',
      fileSize: '38.5 MB',
      timestamp: '3 hours ago',
      modelType: 'hover_car',
      primaryColor: '#F59E0B',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=300&auto=format&fit=crop&q=80',
    },
  ]);

  // Mode switcher definitions
  const modes = [
    { id: 'text_to_3d', label: 'Text to 3D', icon: Wand2, badge: 'V3 Core' },
    { id: 'image_to_3d', label: 'Image to 3D', icon: ImageIcon, badge: 'Vision AI' },
    { id: 'ai_texture', label: 'AI Texture', icon: Palette, badge: 'PBR Synthesizer' },
    { id: 'animate', label: 'Auto Rig & Animate', icon: Film, badge: 'IK Kinematics' },
  ];

  // Art styles for prompt generator
  const artStyles = [
    { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Glowing emissives & brushed alloys' },
    { id: 'pbr_realistic', name: 'PBR Photoreal', desc: 'Micro-scratches & physical roughness' },
    { id: 'low_poly', name: 'Low-Poly Stylized', desc: 'Clean geometric facets for games' },
    { id: 'anime_mech', name: 'Anime Mech', desc: 'Cel-shaded panel lines & bold colors' },
    { id: 'sci_fi', name: 'Sci-Fi Metallic', desc: 'Polished titanium & gold foil accents' },
  ];

  // Handle AI Generation simulation with live feedback
  const handleGenerate = () => {
    if (isGenerating) return;
    sounds.playClick();
    setIsGenerating(true);
    setGenerationProgress(10);

    const modelTypes: Model3DType[] = ['mech', 'quantum_core', 'crystal', 'portal_vfx', 'hoverbike'];
    const randomType = modelTypes[Math.floor(Math.random() * modelTypes.length)];
    const randomColors = ['#00F0FF', '#A855F7', '#10B981', '#F59E0B', '#EF4444'];
    const chosenColor = randomColors[Math.floor(Math.random() * randomColors.length)];

    let current = 10;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 22) + 12;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          sounds.playModeChange();

          const generatedTitle = prompt.length > 28 ? prompt.substring(0, 28) + '...' : prompt || 'New 3D Asset';
          const newAsset: AssetItem = {
            id: `gen-${Date.now()}`,
            title: generatedTitle,
            description: prompt,
            category: 'models',
            tags: ['AI Generated', artStyle],
            creator: {
              id: 'omni-ai',
              name: 'OmniAI Studio',
              avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
              badge: 'Pro Engine',
              rating: 5.0,
              sales: 2400,
              verified: true,
            },
            price: 0,
            rating: 5.0,
            reviewsCount: 1,
            downloadCount: 1,
            likesCount: 1,
            viewsCount: 12,
            dateAdded: new Date().toISOString().split('T')[0],
            formats: ['.GLTF', '.FBX', '.USDZ'],
            modelType: randomType,
            thumbnailImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            isAiGenerated: true,
            licenseType: 'Standard',
            previewBgGradient: 'from-cyan-950 via-slate-900 to-black',
            primaryColor: chosenColor,
            specs: {
              polyCount: detailLevel === 'ultra' ? 84000 : detailLevel === 'high' ? 42000 : 18000,
              vertexCount: detailLevel === 'ultra' ? 92000 : 46000,
              meshCount: 1,
              textureResolution: `${textureRes} PBR`,
              rigged: activeMode === 'animate',
              animated: activeMode === 'animate',
              pbrReady: true,
              uvUnwrapped: true,
              fileSizeMB: detailLevel === 'ultra' ? 38.5 : 19.2,
              engineCompatibility: ['Unreal 5', 'Unity', 'Three.js'],
            },
            reviews: [],
          };

          setActiveAsset(newAsset);
          setPrimaryColor(chosenColor);

          // Add to history list
          const newHistItem: HistoryItem = {
            id: newAsset.id,
            title: generatedTitle,
            prompt: prompt,
            mode: activeMode,
            polyCount: newAsset.specs.polyCount,
            format: 'GLB',
            fileSize: `${newAsset.specs.fileSizeMB} MB`,
            timestamp: 'Just now',
            modelType: randomType,
            primaryColor: chosenColor,
            thumbnailUrl: newAsset.thumbnailImage,
          };
          setHistory(prev => [newHistItem, ...prev]);
        }, 300);
      }
      setGenerationProgress(Math.min(current, 100));
    }, 200);
  };

  // Quick Post-Processing Action
  const handlePostAction = (actionName: string) => {
    sounds.playClick();
    setActivePostAction(actionName);
    setTimeout(() => {
      setActivePostAction(null);
    }, 2000);
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-[#07080c] overflow-hidden">
      
      {/* Three-Zone Workspace Main Container */}
      <div className="flex-1 flex w-full h-full relative overflow-hidden">
        
        {/* ========================================================= */}
        {/* ZONE 1: LEFT RAIL (Fixed ~280px wide, Full Height, Sticky) */}
        {/* ========================================================= */}
        <aside className="w-[300px] shrink-0 h-full bg-slate-950/95 border-r border-slate-800/80 flex flex-col justify-between z-20 shadow-2xl relative">
          
          {/* Scrollable Modes & Settings Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
            
            {/* Studio Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <h2 className="font-bold text-sm text-white tracking-wide">3D Studio AI</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                PRO v3.2
              </span>
            </div>

            {/* Mode Switcher Vertical List */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Generation Pipeline Mode:
              </label>
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      sounds.playModeChange();
                      setActiveMode(mode.id as GenerationMode);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{mode.label}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800">
                      {mode.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Mode Settings Panel */}
            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              
              {/* Prompt Input Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                    {activeMode === 'text_to_3d' && 'Text Prompt Description'}
                    {activeMode === 'image_to_3d' && 'Image Reference & Prompt'}
                    {activeMode === 'ai_texture' && 'Surface Material Prompt'}
                    {activeMode === 'animate' && 'Kinematic Motion Type'}
                  </label>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      const prompts = [
                        'Heavy cybernetic titan mech with hyper-detailed titanium hydraulic joints and plasma weapons',
                        'Ancient obsidian crystal monolith with glowing blue runic inscriptions and hovering fragments',
                        'Modular sci-fi dropship engine thruster with heat vent discoloration and carbon fiber skin',
                        'Futuristic cyberpunk samurai helm with visor display HUD and metallic gold trim',
                      ];
                      setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
                    }}
                    className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Random
                  </button>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe your 3D mesh geometry in detail..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80 placeholder:text-slate-600 resize-none transition-all"
                />
              </div>

              {/* Art Style Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  Visual Art Style Preset:
                </label>
                <select
                  value={artStyle}
                  onChange={(e) => {
                    sounds.playClick();
                    setArtStyle(e.target.value);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {artStyles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name} ({style.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality & Detail Level Settings */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Mesh Density & Detail:
                </label>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'mobile', label: 'Mobile 18K' },
                    { id: 'high', label: 'High 42K' },
                    { id: 'ultra', label: 'Ultra 84K' },
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => {
                        sounds.playClick();
                        setDetailLevel(level.id as any);
                      }}
                      className={`py-1.5 rounded-lg text-[11px] font-mono font-medium border transition-all ${
                        detailLevel === level.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texture Resolution & Options */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Texture Resolution:
                  </label>
                  <div className="flex gap-1">
                    {(['1K', '2K', '4K'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setTextureRes(res)}
                        className={`flex-1 py-1 rounded text-[10px] font-mono font-bold border ${
                          textureRes === res
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Symmetry Mirror:
                  </label>
                  <button
                    onClick={() => setEnableSymmetry(!enableSymmetry)}
                    className={`w-full py-1.5 px-2 rounded text-[10px] font-mono font-bold border flex items-center justify-center gap-1 ${
                      enableSymmetry
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    <Check className={`w-3 h-3 ${enableSymmetry ? 'opacity-100' : 'opacity-0'}`} />
                    X-Axis Mirror
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Fixed Generate Button at Bottom of Left Rail */}
          <div className="p-4 bg-slate-950 border-t border-slate-800/80 shrink-0 space-y-2">
            {isGenerating && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-cyan-400">
                  <span>Synthesizing Mesh Geometry...</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                isGenerating
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-400 text-black hover:brightness-110 shadow-cyan-500/25 active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Generate 3D Model</span>
                </>
              )}
            </button>
          </div>

        </aside>

        {/* ========================================================= */}
        {/* ZONE 2: CENTER PANEL (Dominant Live 3D Viewport)          */}
        {/* ========================================================= */}
        <main className="flex-1 flex flex-col h-full bg-[#050608] relative overflow-hidden">
          
          {/* Attached Thin Post-Generation Action Toolbar */}
          <header className="h-12 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between z-10 shrink-0">
            {/* Active Asset Info Badge */}
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-xs text-white truncate max-w-[200px] sm:max-w-[300px]">
                {activeAsset.title}
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {activeAsset.modelType.toUpperCase()}
              </span>
            </div>

            {/* Post-Generation Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'retexture', label: 'Retexture', icon: Palette },
                { id: 'retopologize', label: 'Retopologize', icon: Scissors },
                { id: 'rig', label: 'Rig & Skeleton', icon: Bone },
                { id: 'animate', label: 'Animate', icon: Flame },
              ].map((act) => {
                const Icon = act.icon;
                const isSelected = activePostAction === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => handlePostAction(act.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 border border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">{act.label}</span>
                  </button>
                );
              })}

              <div className="h-4 w-[1px] bg-slate-800 mx-1" />

              {/* Export GLB Action */}
              <button
                onClick={() => {
                  sounds.playClick();
                  alert(`Exporting ${activeAsset.title} as standard GLB 3D model container!`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export GLB</span>
              </button>
            </div>
          </header>

          {/* DOMINANT 3D VIEWPORT CONTAINER */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#07090e] to-black">
            
            {/* Live 3D Viewport Component */}
            <ThreeViewport
              modelType={activeAsset.modelType}
              primaryColor={primaryColor}
              showControlsBar={true}
              autoRotateDefault={true}
              className="w-full h-full border-none rounded-none"
            />

            {/* Overlaid Corner Badge: Polycount & Stats */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-right font-mono text-[11px] shadow-xl space-y-0.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">Polys:</span>
                  <strong className="text-purple-400 font-bold">
                    {(activeAsset.specs?.polyCount || 48500).toLocaleString()}
                  </strong>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">Format:</span>
                  <strong className="text-cyan-400 font-bold">
                    {activeAsset.formats ? activeAsset.formats.join(' • ') : 'GLTF / GLB'}
                  </strong>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">Size:</span>
                  <strong className="text-emerald-400 font-bold">
                    {activeAsset.specs?.fileSizeMB || 28.4} MB
                  </strong>
                </div>
              </div>
            </div>

            {/* Notification Toast for Post Action */}
            {activePostAction && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-2xl animate-bounce">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Running AI Post-Processing Pipeline: <strong>{activePostAction.toUpperCase()}</strong></span>
              </div>
            )}

          </div>

        </main>

        {/* ========================================================= */}
        {/* ZONE 3: RIGHT COLLAPSIBLE DRAWER (Generation History)      */}
        {/* ========================================================= */}
        <div className={`transition-all duration-300 flex z-20 ${historyOpen ? 'w-[280px]' : 'w-10'}`}>
          
          {/* Drawer Toggle Bar */}
          <button
            onClick={() => {
              sounds.playClick();
              setHistoryOpen(!historyOpen);
            }}
            className="w-10 h-full bg-slate-950 border-l border-slate-800/80 flex flex-col items-center justify-between py-4 text-slate-400 hover:text-white transition-colors"
            title={historyOpen ? 'Collapse History Panel' : 'Expand Generation History'}
          >
            <div className="flex items-center gap-1 text-[11px] font-mono uppercase font-bold tracking-wider [writing-mode:vertical-lr] rotate-180">
              <History className="w-3.5 h-3.5 text-cyan-400 mb-1" />
              Generation History ({history.length})
            </div>
            {historyOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* History Collapsible Content List */}
          {historyOpen && (
            <div className="flex-1 h-full bg-slate-950/95 border-l border-slate-800/80 flex flex-col justify-between overflow-hidden">
              
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  Vault Generations
                </span>
                <span className="text-[10px] font-mono text-slate-500">{history.length} assets saved</span>
              </div>

              {/* Scrollable History Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
                {history.map((item) => {
                  const isCurrent = activeAsset.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        sounds.playClick();
                        setPrimaryColor(item.primaryColor);
                        setActiveAsset({
                          id: item.id,
                          title: item.title,
                          description: item.prompt,
                          category: 'models',
                          tags: ['AI Generated'],
                          creator: {
                            id: 'c-1',
                            name: 'OmniAI Engine',
                            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
                            badge: 'AI Core',
                            rating: 5.0,
                            sales: 1420,
                            verified: true,
                          },
                          price: 0,
                          rating: 5.0,
                          reviewsCount: 1,
                          downloadCount: 1,
                          likesCount: 1,
                          viewsCount: 12,
                          dateAdded: '2026-08-08',
                          formats: ['.GLTF', '.FBX', '.USDZ'],
                          modelType: item.modelType,
                          thumbnailImage: item.thumbnailUrl,
                          isAiGenerated: true,
                          licenseType: 'Standard',
                          previewBgGradient: 'from-cyan-950 via-slate-900 to-black',
                          primaryColor: item.primaryColor,
                          specs: {
                            polyCount: item.polyCount,
                            vertexCount: item.polyCount + 2000,
                            meshCount: 1,
                            textureResolution: '4K PBR',
                            rigged: true,
                            animated: true,
                            pbrReady: true,
                            uvUnwrapped: true,
                            fileSizeMB: parseFloat(item.fileSize),
                            engineCompatibility: ['Unreal 5', 'Unity', 'Three.js'],
                          },
                          reviews: [],
                        });
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2 group ${
                        isCurrent
                          ? 'bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Thumbnail & Title */}
                      <div className="flex gap-2.5 items-center">
                        <div className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800 relative">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-tl-md"
                            style={{ backgroundColor: item.primaryColor }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                            "{item.prompt}"
                          </p>
                        </div>
                      </div>

                      {/* Specs Tags */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="text-purple-400 font-medium">
                          {item.polyCount.toLocaleString()} polys
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                          {item.format}
                        </span>
                        <span className="text-slate-500">{item.fileSize}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
