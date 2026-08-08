import React, { useState } from 'react';
import { AssetItem } from '../types';
import { ThreeViewport } from './ThreeViewport';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  Check, 
  Download, 
  Star, 
  Box, 
  Sparkles, 
  CheckCircle2, 
  BoxSelect,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface AssetCardProps {
  asset: AssetItem;
  onInspect: (asset: AssetItem) => void;
  onAddToCart: (asset: AssetItem) => void;
  isWishlisted: boolean;
  onToggleWishlist: (assetId: string) => void;
  isOwned?: boolean;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onInspect,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  isOwned = false,
}) => {
  const [hovered, setHovered] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'thumbnail' | '3d'>('thumbnail');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [hasEnteredViewport, setHasEnteredViewport] = useState<boolean>(false);

  // Intersection observer hook for lazy loading card content & WebGL contexts
  const [cardRef, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '250px',
    freezeOnceVisible: false,
  });

  // Track if card has ever entered viewport to keep thumbnail cached
  React.useEffect(() => {
    if (isVisible && !hasEnteredViewport) {
      setHasEnteredViewport(true);
    }
  }, [isVisible, hasEnteredViewport]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playCartAdd();
    onAddToCart(asset);
  };

  const handleInstantDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPurchaseSuccess();
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify({ asset: asset.title, format: 'GLTF 2.0', polys: asset.specs.polyCount })], {
        type: 'text/json',
      });
      element.href = URL.createObjectURL(file);
      element.download = `${asset.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.gltf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    onToggleWishlist(asset.id);
  };

  const togglePreviewMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setViewMode(prev => prev === 'thumbnail' ? '3d' : 'thumbnail');
  };

  const shouldRender3D = isVisible && (viewMode === '3d' || hovered);

  return (
    <div
      ref={cardRef}
      className="bg-white/5 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-4 flex flex-col group transition-all duration-300 cursor-pointer relative shadow-lg hover:shadow-cyan-500/10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onInspect(asset)}
    >
      {/* Thumbnail / 3D Viewport Media Area */}
      <div className="aspect-[4/3] bg-zinc-950 rounded-xl mb-3 relative overflow-hidden border border-white/5 group/media">
        
        {/* Render 3D viewport canvas ONLY if currently visible in viewport AND (in 3d mode or hovered) */}
        {shouldRender3D ? (
          <ThreeViewport
            modelType={asset.modelType}
            primaryColor={asset.primaryColor}
            showControlsBar={false}
            autoRotateDefault={true}
            className="w-full h-full"
          />
        ) : (
          <div className="relative w-full h-full bg-zinc-900/60">
            {/* Image Skeleton / Loading Placeholder */}
            {(!hasEnteredViewport || !imageLoaded) && (
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse flex items-center justify-center">
                <Box className="w-8 h-8 text-zinc-700 animate-bounce" />
              </div>
            )}

            {/* Lazy Loaded Thumbnail Image */}
            {hasEnteredViewport && (
              <img
                src={asset.thumbnailImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                alt={asset.title}
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-cover group-hover/media:scale-105 transition-all duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/30" />
          </div>
        )}

        {/* Top Badges Bar */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          
          <div className="flex items-center gap-1.5">
            {/* Price / Free Badge */}
            {asset.price === 0 ? (
              <span className="px-2 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded text-[10px] text-black font-mono font-bold shadow-md">
                FREE
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] border border-cyan-500/30 text-cyan-400 font-mono font-bold shadow-md">
                ${asset.price.toFixed(2)}
              </span>
            )}

            {/* AI Generated Badge */}
            {asset.isAiGenerated && (
              <span className="px-2 py-0.5 bg-purple-500/80 backdrop-blur-md rounded text-[10px] text-white font-mono font-bold flex items-center gap-1 shadow-md">
                <Sparkles className="w-2.5 h-2.5" />
                AI 3D
              </span>
            )}
          </div>

          {/* Action Buttons: Toggle 3D & Wishlist */}
          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              onClick={togglePreviewMode}
              className={`p-1.5 rounded-lg backdrop-blur-md border transition-all text-[10px] font-mono flex items-center gap-1 ${
                viewMode === '3d'
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-black/60 text-zinc-300 border-white/10 hover:text-white hover:bg-black/80'
              }`}
              title={viewMode === '3d' ? 'Show Image Thumbnail' : 'Interactive 3D Preview'}
            >
              {viewMode === '3d' ? <ImageIcon className="w-3.5 h-3.5" /> : <BoxSelect className="w-3.5 h-3.5 text-cyan-400" />}
            </button>

            <button
              onClick={handleWishlist}
              className={`p-1.5 rounded-lg backdrop-blur-md border transition-all ${
                isWishlisted
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                  : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Format Tags & Views Ticker */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {asset.formats.slice(0, 3).map((fmt) => (
              <span
                key={fmt}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/70 text-zinc-300 border border-white/10 backdrop-blur-sm"
              >
                {fmt}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3 text-cyan-400" />
              {asset.viewsCount > 1000 ? `${(asset.viewsCount / 1000).toFixed(1)}k` : asset.viewsCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className="w-3 h-3 text-rose-400" />
              {asset.likesCount}
            </span>
          </div>
        </div>

      </div>

      {/* Details Body */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        
        <div>
          {/* Asset Title */}
          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
            {asset.title}
          </h4>

          {/* Creator Profile line */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <img
              src={asset.creator.avatar}
              alt={asset.creator.name}
              referrerPolicy="no-referrer"
              className="w-4 h-4 rounded-full object-cover ring-1 ring-white/10"
            />
            <span className="text-xs text-zinc-400 font-medium truncate">
              {asset.creator.name}
            </span>
            {asset.creator.verified && (
              <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
            )}
          </div>

          <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
            {asset.description}
          </p>
        </div>

        {/* Technical Specs Metric Bar */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/5">
          <span className="flex items-center gap-1">
            <Box className="w-3 h-3 text-cyan-400" />
            {asset.specs.polyCount > 0 ? `${(asset.specs.polyCount / 1000).toFixed(1)}k polys` : 'Procedural'}
          </span>

          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            <span className="font-bold text-zinc-200">{asset.rating.toFixed(1)}</span>
            <span className="text-zinc-600">({asset.reviewsCount})</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {isOwned ? (
            <span className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" />
              In Library
            </span>
          ) : asset.price === 0 ? (
            <button
              onClick={handleInstantDownload}
              disabled={downloading}
              className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-400 uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-1.5"
            >
              <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? 'Downloading...' : 'Get Free'}</span>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs font-bold text-cyan-400 uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};


