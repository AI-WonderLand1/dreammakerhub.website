import React, { useState } from 'react';
import { 
  Box, 
  Search, 
  ShoppingCart, 
  Heart, 
  Volume2, 
  VolumeX, 
  FolderHeart, 
  Sparkles, 
  Upload, 
  Layers, 
  Menu, 
  X,
  Compass,
  Zap
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface HeaderProps {
  activeTab: 'marketplace' | 'library' | 'sandbox';
  setActiveTab: (tab: 'marketplace' | 'library' | 'sandbox') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  openCart: () => void;
  openUploadModal: () => void;
  totalCartPrice: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  cartCount,
  wishlistCount,
  openCart,
  openUploadModal,
  totalCartPrice,
}) => {
  const [muted, setMuted] = useState<boolean>(sounds.isMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleMuteToggle = () => {
    const isMutedNow = sounds.toggleMute();
    setMuted(isMutedNow);
    if (!isMutedNow) sounds.playClick();
  };

  const navTabClick = (tab: 'marketplace' | 'library' | 'sandbox') => {
    sounds.playClick();
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => navTabClick('marketplace')}
        >
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_22px_rgba(6,182,212,0.8)] transition-all">
            <Box className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">
            NEXUS<span className="text-cyan-400">3D</span>
          </span>
        </div>

        {/* Quick Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 3D models, textures, shaders..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
            />
            <div className="absolute left-4 top-2.5 opacity-40 text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => navTabClick('marketplace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'marketplace'
                ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Marketplace
          </button>

          <button
            onClick={() => navTabClick('library')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'library'
                ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            3D Vault
          </button>

          <button
            onClick={() => navTabClick('sandbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'sandbox'
                ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Studio Sandbox
          </button>
        </nav>

        {/* Actions Right */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          
          {/* Upload Button */}
          <button
            onClick={() => {
              sounds.playClick();
              openUploadModal();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          {/* SFX Mute Button */}
          <button
            onClick={handleMuteToggle}
            className={`p-2 rounded-lg border transition-all ${
              muted
                ? 'bg-white/5 text-zinc-500 border-white/10'
                : 'bg-white/5 text-cyan-400 border-cyan-500/30 hover:bg-white/10'
            }`}
            title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Balance Display Pill */}
          <div className="hidden xl:flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Balance</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold">4.205 ETH</span>
          </div>

          {/* Shopping Cart Button */}
          <button
            onClick={() => {
              sounds.playClick();
              openCart();
            }}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-200 hover:border-cyan-500/30 hover:bg-white/10 transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 text-cyan-400" />
            {totalCartPrice > 0 && (
              <span className="hidden sm:inline text-xs font-mono font-bold text-cyan-400">
                ${totalCartPrice.toFixed(2)}
              </span>
            )}
            {cartCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-400 text-black text-[10px] font-extrabold font-mono shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Avatar with Glowing Gradient Ring */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border border-cyan-500/30 p-0.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="User profile"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Expandable Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-black/95 border-b border-white/10 p-4 space-y-3 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200 z-50">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 3D assets..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => navTabClick('marketplace')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${
                activeTab === 'marketplace' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-zinc-400'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Marketplace</span>
            </button>
            <button
              onClick={() => navTabClick('library')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${
                activeTab === 'library' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-zinc-400'
              }`}
            >
              <FolderHeart className="w-4 h-4" />
              <span>3D Vault</span>
            </button>
            <button
              onClick={() => navTabClick('sandbox')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${
                activeTab === 'sandbox' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-zinc-400'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Studio Sandbox</span>
            </button>
          </div>

          <button
            onClick={() => {
              openUploadModal();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Asset</span>
          </button>
        </div>
      )}
    </header>
  );
};
