'use client';
import React, { useState } from 'react';
import { AssetItem, CartItem } from '../types';
import { ThreeViewport } from './ThreeViewport';
import { 
  X, 
  Download, 
  ShoppingCart, 
  Star, 
  Box, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  FileCheck, 
  Heart, 
  Share2, 
  Sparkles, 
  MessageSquare, 
  Send,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundEffects';

interface AssetDetailModalProps {
  asset: AssetItem | null;
  onClose: () => void;
  onAddToCart: (asset: AssetItem, license: 'Standard' | 'Commercial' | 'Enterprise') => void;
  isWishlisted: boolean;
  onToggleWishlist: (assetId: string) => void;
  isOwned?: boolean;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  isOwned = false,
}) => {
  if (!asset) return null;

  const [selectedLicense, setSelectedLicense] = useState<'Standard' | 'Commercial' | 'Enterprise'>('Standard');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');
  const [newComment, setNewComment] = useState<string>('');
  const [reviewsList, setReviewsList] = useState(asset.reviews);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const getPriceForLicense = () => {
    if (asset.price === 0) return 0;
    if (selectedLicense === 'Standard') return asset.price;
    if (selectedLicense === 'Commercial') return asset.price * 2.5;
    return asset.price * 6.0;
  };

  const handleDownload = () => {
    sounds.playPurchaseSuccess();
    setDownloading(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }

    setTimeout(() => {
      setDownloading(false);
      const element = document.createElement('a');
      const file = new Blob([
        JSON.stringify({
          title: asset.title,
          license: selectedLicense,
          specs: asset.specs,
          formats: asset.formats,
          downloadTimestamp: new Date().toISOString(),
        }, null, 2)
      ], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = `${asset.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-package.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    sounds.playClick();
    const review = {
      id: `rev-${Date.now()}`,
      user: 'You (Creator)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      rating: 5,
      date: 'Just now',
      comment: newComment,
    };
    setReviewsList([review, ...reviewsList]);
    setNewComment('');
  };

  const handleShare = () => {
    sounds.playClick();
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col lg:flex-row max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Interactive WebGL 3D Viewport Inspector */}
        <div className="w-full lg:w-3/5 bg-slate-950 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[420px] lg:min-h-full">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                360° LIVE 3D INSPECTOR
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    onToggleWishlist(asset.id);
                  }}
                  className={`p-1.5 rounded-lg border transition-all ${
                    isWishlisted
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Viewport */}
            <div className="w-full h-[360px] lg:h-[460px] rounded-2xl overflow-hidden shadow-2xl relative">
              <ThreeViewport
                modelType={asset.modelType}
                primaryColor={asset.primaryColor}
                showControlsBar={true}
                autoRotateDefault={true}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Quick Specifications Metrics Below Viewport */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800 text-center font-mono">
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase">Polygons</p>
              <p className="text-xs font-bold text-cyan-300">
                {asset.specs.polyCount > 0 ? asset.specs.polyCount.toLocaleString() : 'Procedural'}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase">Vertices</p>
              <p className="text-xs font-bold text-purple-300">
                {asset.specs.vertexCount > 0 ? asset.specs.vertexCount.toLocaleString() : 'Dynamic'}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase">PBR Maps</p>
              <p className="text-xs font-bold text-emerald-300">
                {asset.specs.pbrReady ? '4K PBR' : 'Standard'}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase">Skeleton</p>
              <p className="text-xs font-bold text-amber-300">
                {asset.specs.rigged ? 'Rigged' : 'Static Mesh'}
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Asset Details, Licensing & Checkout */}
        <div className="w-full lg:w-2/5 p-6 lg:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          
          <div className="space-y-4">
            
            {/* Category & Rating */}
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase font-mono font-bold text-cyan-400 tracking-wider">
                {asset.category.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{asset.rating.toFixed(2)}</span>
                <span className="text-slate-500">({reviewsList.length} reviews)</span>
              </div>
            </div>

            {/* Asset Title */}
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {asset.title}
            </h2>

            {/* Creator Profile Badge */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <img
                src={asset.creator.avatar}
                alt={asset.creator.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-cyan-500/40"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-100 truncate">{asset.creator.name}</span>
                  {asset.creator.verified && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 font-mono">{asset.creator.badge} • {asset.creator.sales} sales</p>
              </div>
              <button 
                onClick={() => sounds.playClick()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Follow
              </button>
            </div>

            {/* Tabs Selector: Overview | Specs | Reviews */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('overview');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('specs');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'specs'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tech Specs
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('reviews');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Reviews ({reviewsList.length})
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>{asset.description}</p>

                {/* File Formats Included */}
                <div className="space-y-1.5 pt-2">
                  <p className="font-mono font-bold text-slate-400 uppercase">Included File Formats:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {asset.formats.map((fmt) => (
                      <span key={fmt} className="px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-300 border border-slate-800 font-mono font-bold">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Compatible Game Engines */}
                <div className="space-y-1.5 pt-2">
                  <p className="font-mono font-bold text-slate-400 uppercase">Verified Engines & Software:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {asset.specs.engineCompatibility.map((engine) => (
                      <span key={engine} className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                        ✓ {engine}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">File Size</span>
                  <span className="text-slate-200 font-bold">{asset.specs.fileSizeMB} MB</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Mesh Count</span>
                  <span className="text-slate-200 font-bold">{asset.specs.meshCount} Sub-meshes</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Texture Maps</span>
                  <span className="text-slate-200 font-bold">{asset.specs.textureResolution}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">UV Unwrapped</span>
                  <span className="text-emerald-400 font-bold">{asset.specs.uvUnwrapped ? 'Yes (Non-overlapping)' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Rigged Skeleton</span>
                  <span className="text-purple-400 font-bold">{asset.specs.rigged ? 'Full Bone Rig' : 'Unrigged'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Animated</span>
                  <span className="text-cyan-400 font-bold">{asset.specs.animated ? 'Looping Animations' : 'Static'}</span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Submit Review */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave a review or feedback..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{rev.user}</span>
                        <span className="text-amber-400 font-mono">{'★'.repeat(rev.rating)}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* License Selection Tier Box */}
            {asset.price > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                  Select Usage License:
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Standard', label: 'Indie', price: asset.price },
                    { id: 'Commercial', label: 'Studio', price: asset.price * 2.5 },
                    { id: 'Enterprise', label: 'Unlimited', price: asset.price * 6.0 },
                  ].map((lic) => {
                    const isSel = selectedLicense === lic.id;
                    return (
                      <button
                        key={lic.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedLicense(lic.id as typeof selectedLicense);
                        }}
                        className={`p-2.5 rounded-xl text-center border transition-all ${
                          isSel
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <p className="text-[11px] font-mono">{lic.label}</p>
                        <p className="text-xs font-extrabold text-white font-mono mt-0.5">${lic.price.toFixed(2)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Action Footer Button */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {isOwned ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                <span>{downloading ? 'Preparing Package...' : 'Download Assets Package (.ZIP / .GLTF)'}</span>
              </button>
            ) : asset.price === 0 ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                <span>{downloading ? 'Preparing Free Assets...' : 'Instant Free Download (.GLTF / .FBX)'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onAddToCart(asset, selectedLicense);
                  onClose();
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add To Cart • ${getPriceForLicense().toFixed(2)}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
