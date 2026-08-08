'use client';
import React, { useState } from 'react';
import { AssetItem, UserCollection } from '../types';
import { AssetCard } from './AssetCard';
import { AssetGrid } from './AssetGrid';
import { 
  FolderHeart, 
  Download, 
  Plus, 
  Sparkles, 
  Box, 
  FileJson, 
  Folder, 
  Layers, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface LibraryVaultProps {
  ownedAssets: AssetItem[];
  wishlistAssets: AssetItem[];
  onInspect: (asset: AssetItem) => void;
  onOpenSandbox: (asset: AssetItem) => void;
  onAddToCart: (asset: AssetItem) => void;
  onToggleWishlist: (assetId: string) => void;
  wishlistIds: string[];
}

export const LibraryVault: React.FC<LibraryVaultProps> = ({
  ownedAssets,
  wishlistAssets,
  onInspect,
  onOpenSandbox,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
}) => {
  const [activeTab, setActiveTab] = useState<'owned' | 'wishlist' | 'collections'>('owned');
  const [search, setSearch] = useState<string>('');

  // Sample User Collections
  const [collections, setCollections] = useState<UserCollection[]>([
    {
      id: 'col-1',
      name: 'Sci-Fi Level Props',
      description: 'Game ready assets for level 1 orbital bridge scene',
      assets: ownedAssets.slice(0, 2),
      createdAt: '2026-08-01',
    },
    {
      id: 'col-2',
      name: '4K PBR Texture Library',
      description: 'Seamless terrain and metallic shaders',
      assets: ownedAssets.slice(2, 4),
      createdAt: '2026-07-20',
    },
  ]);

  const [newColName, setNewColName] = useState<string>('');
  const [showColModal, setShowColModal] = useState<boolean>(false);

  const filteredOwned = ownedAssets.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const createCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    sounds.playClick();
    const newCol: UserCollection = {
      id: `col-${Date.now()}`,
      name: newColName,
      description: 'Custom asset collection folder',
      assets: ownedAssets.slice(0, 1),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCollections([newCol, ...collections]);
    setNewColName('');
    setShowColModal(false);
  };

  const exportManifest = () => {
    sounds.playClick();
    const manifest = {
      user: 'Creator Vault',
      totalAssets: ownedAssets.length,
      exportDate: new Date().toISOString(),
      assets: ownedAssets.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        formats: a.formats,
        polyCount: a.specs.polyCount,
      })),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dimension3d-library-manifest.json';
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Vault Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 p-[1px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <FolderHeart className="w-7 h-7 text-purple-400" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              3D Vault Library
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-mono">
                {ownedAssets.length} Assets
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Your permanent asset repository, format downloads, and project collections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportManifest}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-950 text-slate-200 border border-slate-800 hover:bg-slate-800"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Export Manifest JSON</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('owned');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'owned'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Owned Assets ({ownedAssets.length})
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('wishlist');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wishlist'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wishlist ({wishlistAssets.length})
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('collections');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'collections'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Collections ({collections.length})
          </button>
        </div>

        {/* Vault Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vault assets..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

      </div>

      {/* Tab Views */}
      {activeTab === 'owned' && (
        <AssetGrid
          assets={filteredOwned}
          onInspect={onInspect}
          onAddToCart={onAddToCart}
          wishlistIds={wishlistIds}
          onToggleWishlist={onToggleWishlist}
          ownedAssetIds={ownedAssets.map(a => a.id)}
          columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          showSandboxButton={true}
          onOpenSandbox={onOpenSandbox}
          emptyTitle="No Assets Found in Vault"
          emptyDescription="Browse the 3D Marketplace to add free and premium 3D assets to your permanent library!"
        />
      )}

      {activeTab === 'wishlist' && (
        <AssetGrid
          assets={wishlistAssets}
          onInspect={onInspect}
          onAddToCart={onAddToCart}
          wishlistIds={wishlistIds}
          onToggleWishlist={onToggleWishlist}
          ownedAssetIds={ownedAssets.map(a => a.id)}
          columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          emptyTitle="Your Wishlist Is Empty"
          emptyDescription="Click the heart icon on any 3D asset card to save it for later inspection!"
        />
      )}

      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm font-mono uppercase">
              Project Collections ({collections.length})
            </h3>

            <button
              onClick={() => setShowColModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Collection Folder</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collections.map((col) => (
              <div key={col.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
                      <Folder className="w-5 h-5 text-cyan-400" />
                      {col.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">{col.description}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{col.createdAt}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {col.assets.map((ast) => (
                    <div
                      key={ast.id}
                      onClick={() => onInspect(ast)}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40 transition-all"
                    >
                      <p className="font-bold text-xs text-slate-200 truncate">{ast.title}</p>
                      <p className="text-[10px] font-mono text-cyan-400 mt-1">{ast.category}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Collection Modal */}
      {showColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create New Collection Folder</h3>
            <form onSubmit={createCollection} className="space-y-4">
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g. Cyberpunk Game Level 1"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
