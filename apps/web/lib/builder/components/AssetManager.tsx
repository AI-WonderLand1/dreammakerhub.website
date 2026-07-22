'use client';

import React, { useState } from 'react';

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'font' | 'icon';
  url: string;
  size: string;
}

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([
    { id: '1', name: 'Hero Background.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', size: '1.2 MB' },
    { id: '2', name: 'Logo.svg', type: 'icon', url: '/logo.svg', size: '14 KB' },
    { id: '3', name: 'Inter-Variable.woff2', type: 'font', url: '/fonts/inter.woff2', size: '88 KB' },
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'icon' | 'font'>('all');

  const filtered = activeTab === 'all' ? assets : assets.filter((a) => a.type === activeTab);

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-white p-4 border-r border-white/10 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold">Asset Manager</h3>
        <label className="cursor-pointer text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-2.5 py-1 rounded transition-colors">
          Upload
          <input type="file" className="hidden" onChange={(e) => {
            if (e.target.files?.[0]) {
              const file = e.target.files[0];
              const newAsset: Asset = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type.startsWith('image') ? 'image' : 'icon',
                url: URL.createObjectURL(file),
                size: `${(file.size / 1024).toFixed(0)} KB`,
              };
              setAssets([newAsset, ...assets]);
            }
          }} />
        </label>
      </div>

      <div className="flex gap-1 mb-3 bg-black/40 p-1 rounded-lg border border-white/5">
        {(['all', 'image', 'icon', 'font'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-[10px] font-semibold uppercase py-1 rounded transition-colors ${
              activeTab === tab ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.map((asset) => (
          <div key={asset.id} className="p-2 rounded border border-white/5 bg-white/[0.02] hover:border-purple-500/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-black/50 border border-white/10 flex items-center justify-center text-xs overflow-hidden shrink-0">
              {asset.type === 'image' ? (
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
              ) : (
                '📁'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{asset.name}</p>
              <p className="text-[10px] text-white/40">{asset.size} • {asset.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
