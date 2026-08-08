'use client';
import React from 'react';
import { AssetItem } from '../types';
import { AssetCard } from './AssetCard';
import { AlertCircle, Box, Sparkles, Zap } from 'lucide-react';

interface AssetGridProps {
  assets: AssetItem[];
  onInspect: (asset: AssetItem) => void;
  onAddToCart: (asset: AssetItem) => void;
  wishlistIds: string[];
  onToggleWishlist: (assetId: string) => void;
  ownedAssetIds?: string[];
  onOpenSandbox?: (asset: AssetItem) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilters?: () => void;
  columnsClassName?: string;
  showSandboxButton?: boolean;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  onInspect,
  onAddToCart,
  wishlistIds,
  onToggleWishlist,
  ownedAssetIds = [],
  onOpenSandbox,
  isLoading = false,
  emptyTitle = "No Matching 3D Assets",
  emptyDescription = "Try resetting your search query or adjusting the category and format filters.",
  onResetFilters,
  columnsClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
  showSandboxButton = false,
}) => {
  if (isLoading) {
    return (
      <div className={`grid ${columnsClassName}`}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col space-y-4 animate-pulse"
          >
            <div className="aspect-[4/3] bg-zinc-900/80 rounded-xl relative overflow-hidden flex items-center justify-center">
              <Box className="w-8 h-8 text-zinc-700 animate-spin" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
              <div className="h-3 bg-zinc-800/40 rounded w-full" />
            </div>
            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <div className="h-3 bg-zinc-800 rounded w-1/3" />
              <div className="h-8 bg-zinc-800 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl space-y-4 max-w-2xl mx-auto">
        <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
        <div>
          <h3 className="font-bold text-zinc-200 text-base">{emptyTitle}</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            {emptyDescription}
          </p>
        </div>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-lg bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid Status Info Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Showing <strong className="text-zinc-200">{assets.length}</strong> assets
        </span>
        <span className="flex items-center gap-1 text-zinc-500">
          <Zap className="w-3 h-3 text-cyan-400" />
          Intersection Observer Lazy WebGL Active
        </span>
      </div>

      {/* Asset Cards Grid */}
      <div className={`grid ${columnsClassName}`}>
        {assets.map((asset) => (
          <div key={asset.id} className="relative group">
            <AssetCard
              asset={asset}
              onInspect={onInspect}
              onAddToCart={onAddToCart}
              isWishlisted={wishlistIds.includes(asset.id)}
              onToggleWishlist={onToggleWishlist}
              isOwned={ownedAssetIds.includes(asset.id)}
            />

            {/* Optional Sandbox Quick Test Button for Vault Library */}
            {showSandboxButton && onOpenSandbox && (
              <button
                onClick={() => onOpenSandbox(asset)}
                className="w-full mt-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 hover:border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test in 3D Sandbox</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
