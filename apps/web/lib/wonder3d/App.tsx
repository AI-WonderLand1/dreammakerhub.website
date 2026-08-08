import React, { useState, useMemo } from 'react';
import { AssetItem, CartItem, FilterState, AssetCategory } from './types';
import { getSeededAssets } from './utils/seedData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FilterSidebar } from './components/FilterSidebar';
import { AssetCard } from './components/AssetCard';
import { AssetGrid } from './components/AssetGrid';
import { AssetDetailModal } from './components/AssetDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { LibraryVault } from './components/LibraryVault';
import { SandboxStudio } from './components/SandboxStudio';
import { CreatorUploadModal } from './components/CreatorUploadModal';
import { Footer } from './components/Footer';
import { Box, Sparkles, Filter, AlertCircle } from 'lucide-react';
import { sounds } from './utils/soundEffects';

export default function App() {
  // Navigation & Data State
  const [activeTab, setActiveTab] = useState<'marketplace' | 'library' | 'sandbox'>('marketplace');
  const [assets, setAssets] = useState<AssetItem[]>(getSeededAssets);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Vault State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['asset-mech-01', 'asset-bike-03']);
  const [ownedAssetIds, setOwnedAssetIds] = useState<string[]>(['asset-crystal-02', 'asset-flora-09']);

  // Modals State
  const [selectedInspectAsset, setSelectedInspectAsset] = useState<AssetItem | null>(null);
  const [sandboxTargetAsset, setSandboxTargetAsset] = useState<AssetItem | null>(null);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
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

  // Filter & Sort Logic
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      // Global Search
      const textQuery = (searchQuery || filters.search).toLowerCase().trim();
      if (textQuery) {
        const matchesTitle = item.title.toLowerCase().includes(textQuery);
        const matchesDesc = item.description.toLowerCase().includes(textQuery);
        const matchesCreator = item.creator.name.toLowerCase().includes(textQuery);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(textQuery));
        if (!matchesTitle && !matchesDesc && !matchesCreator && !matchesTag) return false;
      }

      // Category
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Formats
      if (filters.formats.length > 0) {
        const hasFormat = filters.formats.some((fmt) => item.formats.includes(fmt));
        if (!hasFormat) return false;
      }

      // Free / Price
      if (filters.freeOnly && item.price > 0) return false;
      if (!filters.freeOnly && item.price > filters.maxPrice) return false;

      // Polycount
      if (filters.maxPolyCount < 200000 && item.specs.polyCount > filters.maxPolyCount) {
        return false;
      }

      // Feature Checkboxes
      if (filters.pbrOnly && !item.specs.pbrReady) return false;
      if (filters.riggedOnly && !item.specs.rigged) return false;
      if (filters.animatedOnly && !item.specs.animated) return false;

      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'polyCount':
          return a.specs.polyCount - b.specs.polyCount;
        case 'trending':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.downloadCount - a.downloadCount;
      }
    });
  }, [assets, searchQuery, filters]);

  // Handlers
  const handleAddToCart = (asset: AssetItem, license: 'Standard' | 'Commercial' | 'Enterprise' = 'Standard') => {
    let price = asset.price;
    if (license === 'Commercial') price *= 2.5;
    if (license === 'Enterprise') price *= 6.0;

    setCart((prev) => [...prev, { asset, license, price }]);
  };

  const handleToggleWishlist = (assetId: string) => {
    setWishlistIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handlePublishAsset = (newAsset: AssetItem) => {
    setAssets((prev) => [newAsset, ...prev]);
    setOwnedAssetIds((prev) => [...prev, newAsset.id]);
  };

  const handleCompletePurchase = (purchasedItems: CartItem[]) => {
    const newIds = purchasedItems.map((i) => i.asset.id);
    setOwnedAssetIds((prev) => Array.from(newSet([...prev, ...newIds])));
    setCart([]);
  };

  function newSet<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
  }

  const handleOpenSandbox = (asset: AssetItem) => {
    setSandboxTargetAsset(asset);
    setActiveTab('sandbox');
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price, 0);
  const ownedAssets = assets.filter((a) => ownedAssetIds.includes(a.id));
  const wishlistAssets = assets.filter((a) => wishlistIds.includes(a.id));

  return (
    <div className="min-h-screen bg-[#020203] text-zinc-100 flex flex-col font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-black relative">
      
      {/* Ambient Backdrop Lighting Effects */}
      <div className="fixed top-[-200px] left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cart.length}
        wishlistCount={wishlistIds.length}
        openCart={() => setCartOpen(true)}
        openUploadModal={() => setUploadModalOpen(true)}
        totalCartPrice={totalCartPrice}
      />

      {/* Main View Router */}
      <main className="flex-1 relative z-10">
        
        {/* Marketplace View */}
        {activeTab === 'marketplace' && (
          <div className="space-y-4">
            
            {/* Hero Banner */}
            <HeroSection
              selectedCategory={filters.category}
              onCategorySelect={(cat) => setFilters((p) => ({ ...p, category: cat }))}
              onExploreClick={() => {
                const el = document.getElementById('marketplace-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onSandboxClick={() => setActiveTab('sandbox')}
            />

            {/* Marketplace Assets Layout */}
            <div id="marketplace-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                    Library Marketplace
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono">
                      {filteredAssets.length} ASSETS
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Verified game models, procedural shaders, and Niagara particles with live WebGL previews.
                  </p>
                </div>
              </div>

              {/* Main Grid + Sidebar Container */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Filter Sidebar */}
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  totalMatching={filteredAssets.length}
                />

                {/* Assets Grid */}
                <div className="flex-1 w-full">
                  <AssetGrid
                    assets={filteredAssets}
                    onInspect={(a) => setSelectedInspectAsset(a)}
                    onAddToCart={(a) => handleAddToCart(a)}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={handleToggleWishlist}
                    ownedAssetIds={ownedAssetIds}
                    onResetFilters={() => {
                      sounds.playClick();
                      setSearchQuery('');
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
                    }}
                  />
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 3D Vault Library View */}
        {activeTab === 'library' && (
          <LibraryVault
            ownedAssets={ownedAssets}
            wishlistAssets={wishlistAssets}
            onInspect={(a) => setSelectedInspectAsset(a)}
            onOpenSandbox={handleOpenSandbox}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />
        )}

        {/* 3D Studio Sandbox View */}
        {activeTab === 'sandbox' && (
          <SandboxStudio
            availableAssets={assets}
            initialAsset={sandboxTargetAsset}
          />
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* Detail Inspection Modal */}
      <AssetDetailModal
        asset={selectedInspectAsset}
        onClose={() => setSelectedInspectAsset(null)}
        onAddToCart={(asset, license) => handleAddToCart(asset, license)}
        isWishlisted={selectedInspectAsset ? wishlistIds.includes(selectedInspectAsset.id) : false}
        onToggleWishlist={handleToggleWishlist}
        isOwned={selectedInspectAsset ? ownedAssetIds.includes(selectedInspectAsset.id) : false}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onRemoveFromCart={(idx) => setCart((prev) => prev.filter((_, i) => i !== idx))}
        onClearCart={() => setCart([])}
        onCompletePurchase={handleCompletePurchase}
      />

      {/* Creator Upload Modal */}
      <CreatorUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onPublishAsset={handlePublishAsset}
      />

    </div>
  );
}
