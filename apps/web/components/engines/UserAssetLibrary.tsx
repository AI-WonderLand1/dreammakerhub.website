'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { logger } from '@/lib/logger';

interface UserAsset {
  id: string;
  name: string;
  source: string;
  downloadUrl: string;
  thumbnailUrl: string;
}

interface UserAssetLibraryProps {
  onSelect?: (asset: UserAsset) => void;
}

export function UserAssetLibrary({ onSelect }: UserAssetLibraryProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetchAssets() {
      try {
        const res = await fetch(`/api/assets/user?userId=${user.id}`);
        const data = await res.json();
        setAssets(data.assets || []);
      } catch (err) {
        logger.error('Failed to fetch user assets:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="p-4 text-center text-white/50">
        Sign in to see your downloaded assets
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="p-4 text-center text-white/50 text-sm">
        No assets yet. Search and download from External Libs!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {assets.map((asset) => (
        <div
          key={asset.id}
          onClick={() => onSelect?.(asset)}
          className="cursor-pointer hover:border-cyan-500 border border-transparent rounded-lg overflow-hidden"
        >
          <div className="aspect-square bg-white/5">
            {asset.thumbnailUrl ? (
              <img
                src={asset.thumbnailUrl}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
            )}
          </div>
          <div className="p-1 text-xs text-white/70 truncate">{asset.name}</div>
        </div>
      ))}
    </div>
  );
}