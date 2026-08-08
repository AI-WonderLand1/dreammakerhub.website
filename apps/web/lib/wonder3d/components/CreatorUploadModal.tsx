import React, { useState } from 'react';
import { AssetItem, AssetCategory, AssetFormat, Model3DType } from '../types';
import { 
  X, 
  Upload, 
  Box, 
  Sparkles, 
  DollarSign, 
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface CreatorUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishAsset: (newAsset: AssetItem) => void;
}

export const CreatorUploadModal: React.FC<CreatorUploadModalProps> = ({
  isOpen,
  onClose,
  onPublishAsset,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<AssetCategory>('models');
  const [price, setPrice] = useState<number>(19.99);
  const [isFree, setIsFree] = useState<boolean>(false);
  const [modelType, setModelType] = useState<Model3DType>('mech');
  const [selectedFormats, setSelectedFormats] = useState<AssetFormat[]>(['.GLTF', '.FBX', '.BLEND']);
  const [polyCount, setPolyCount] = useState<number>(25000);
  const [rigged, setRigged] = useState<boolean>(true);
  const [animated, setAnimated] = useState<boolean>(true);

  const availableFormats: AssetFormat[] = ['.GLTF', '.FBX', '.OBJ', '.BLEND', '.UNREAL', '.UNITY', '.4K_PBR'];

  const toggleFormat = (fmt: AssetFormat) => {
    sounds.playClick();
    setSelectedFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    sounds.playPurchaseSuccess();

    const newAsset: AssetItem = {
      id: `custom-asset-${Date.now()}`,
      title,
      description: description || 'High-quality 3D asset published via Creator Hub.',
      category,
      tags: ['New Release', 'Creator Studio', category],
      creator: {
        id: 'user-creator',
        name: 'You (Verified Creator)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        badge: 'PRO Creator',
        rating: 5.0,
        sales: 1,
        verified: true,
      },
      price: isFree ? 0 : price,
      rating: 5.0,
      reviewsCount: 1,
      downloadCount: 1,
      likesCount: 1,
      viewsCount: 12,
      dateAdded: new Date().toISOString().split('T')[0],
      formats: selectedFormats,
      modelType,
      thumbnailImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      isAiGenerated: false,
      licenseType: isFree ? 'CC0' : 'Standard',
      previewBgGradient: 'from-cyan-950 via-slate-900 to-black',
      primaryColor: '#00F0FF',
      specs: {
        polyCount,
        vertexCount: Math.round(polyCount * 0.85),
        meshCount: 4,
        textureResolution: '4096 x 4096 (4K)',
        rigged,
        animated,
        pbrReady: true,
        uvUnwrapped: true,
        fileSizeMB: 48.5,
        engineCompatibility: ['Unreal Engine 5', 'Unity', 'Blender'],
      },
      reviews: [],
    };

    onPublishAsset(newAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Upload className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white">Publish New 3D Asset</h2>
              <p className="text-xs text-slate-400">Share your 3D models with the global creator community</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-300 uppercase">Asset Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cyberpunk Heavy Hover Drone"
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-300 uppercase">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe mesh topology, textures, bone rigging, and usage instructions..."
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category & Model Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="models">3D Models</option>
                <option value="materials">4K PBR Materials</option>
                <option value="environments">Environments & HDRIs</option>
                <option value="vfx">VFX & Shaders</option>
                <option value="building_kits">Modular Building Kits</option>
                <option value="audio">Sound FX Audio</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-slate-300 uppercase">Interactive 3D Preset</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value as Model3DType)}
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="mech">Combat Mech Chassis</option>
                <option value="crystal">Aetheria Crystal Citadel</option>
                <option value="hoverbike">Cyberpunk Hover Bike</option>
                <option value="helmet">Neon Tactical Helmet</option>
                <option value="pbr_sphere">4K PBR Texture Sphere</option>
                <option value="portal_vfx">Swirling Portal VFX</option>
                <option value="quantum_core">Quantum Plasma Core</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase">Pricing Tier</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-emerald-400 cursor-pointer"
                />
                <span className="text-xs text-emerald-400 font-bold">Publish As Free Asset</span>
              </label>
            </div>

            {!isFree && (
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Formats Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase">Included File Formats</label>
            <div className="flex flex-wrap gap-2">
              {availableFormats.map((fmt) => {
                const isSel = selectedFormats.includes(fmt);
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => toggleFormat(fmt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      isSel
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {fmt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Polycount & Rig Checkboxes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400">Polygons</label>
              <input
                type="number"
                value={polyCount}
                onChange={(e) => setPolyCount(parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={rigged}
                onChange={(e) => setRigged(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-purple-400"
              />
              <span className="text-xs text-slate-300 font-mono">Rigged</span>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={animated}
                onChange={(e) => setAnimated(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-purple-400"
              />
              <span className="text-xs text-slate-300 font-mono">Animated</span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.01]"
            >
              Publish to Marketplace
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
