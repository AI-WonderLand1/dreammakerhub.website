'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ExternalAsset {
  id: string;
  name: string;
  source: 'playcanvas' | 'sketchfab' | 'poly-haven' | 'local';
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  format: string;
  category: string;
  author?: string;
  license?: string;
}

interface AssetPickerProps {
  onSelect?: (asset: ExternalAsset) => void;
  onDownload?: (asset: ExternalAsset) => Promise<void>;
}

export function AssetPicker({ onSelect, onDownload }: AssetPickerProps) {
  const [query, setQuery] = useState('car');
  const [assets, setAssets] = useState<ExternalAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const searchAssets = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/assets/search?q=${encodeURIComponent(query)}&source=${selectedSource}&limit=12`
      );
      const data = await res.json();
      console.log('[AssetPicker] Search results:', data);
      setAssets(data.assets || []);
      if (data.error) {
        console.error('[AssetPicker] API error:', data.error);
      }
    } catch (err) {
      console.error('[AssetPicker] Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSource]);

  useEffect(() => {
    const debounce = setTimeout(searchAssets, 500);
    return () => clearTimeout(debounce);
  }, [searchAssets]);

  const handleDownload = async (asset: ExternalAsset) => {
    setDownloadingId(asset.id);
    try {
      if (onDownload) {
        await onDownload(asset);
      } else {
        const res = await fetch('/api/assets/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Downloaded!`);
        } else {
          alert(data.error || 'Download failed');
        }
        const data = await res.json();
        if (data.localUrl) {
          alert(`Downloaded to: ${data.localUrl}`);
        }
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const sourceLogos: Record<string, string> = {
    'open-source': '📦',
    sketchfab: '📦',
    'poly-haven': '🏔️',
    local: '💾'
  };

  return (
    <div className="bg-black text-white rounded-xl border border-white/20 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 3D models..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={searchAssets}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 rounded-lg font-medium hover:bg-cyan-500 disabled:opacity-50"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>
        
        <div className="flex gap-2">
          {['all', 'open-source', 'sketchfab', 'poly-haven'].map((source) => (
            <button
              key={source}
              onClick={() => setSelectedSource(source)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedSource === source
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {source === 'all' ? '🌐 All' : sourceLogos[source] + ' ' + source}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-white/10 rounded-lg mb-2" />
                <div className="h-3 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <p>Search for 3D models from external libraries</p>
            <p className="text-sm mt-2">Try: car, character, building, tree</p>
            {selectedSource === 'sketchfab' && (
              <p className="text-xs mt-2 text-yellow-400">Note: Sketchfab requires API token in .env file</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative bg-white/5 rounded-lg overflow-hidden hover:border-cyan-500/50 border border-transparent transition"
              >
                <div
                  className="aspect-square bg-white/5 cursor-pointer"
                  onClick={() => onSelect?.(asset)}
                >
                  {asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🎮
                    </div>
                  )}
                </div>
                
                <div className="p-2">
                  <p className="text-xs text-white/80 truncate">{asset.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-white/40">
                      {sourceLogos[asset.source]}
                    </span>
                    <button
                      onClick={() => handleDownload(asset)}
                      disabled={downloadingId === asset.id}
                      className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                    >
                      {downloadingId === asset.id ? '...' : '+'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/10 text-xs text-white/40">
        <Link href="/library" className="hover:text-cyan-400">
          ← Browse local library
        </Link>
      </div>
    </div>
  );
}