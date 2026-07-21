"use client";

import { useState } from "react";
import { logger } from '@/lib/logger';

interface Asset {
  id: string;
  name: string;
  type: "model" | "material" | "texture" | "light";
  preview: string;
  code: string;
}

const ASSETS: Asset[] = [
  {
    id: "cube",
    name: "Cube",
    type: "model",
    preview: "⬜",
    code: `{
  "type": "cube",
  "position": [0, 0, 0],
  "scale": [1, 1, 1],
  "material": "basic"
}`
  },
  {
    id: "sphere",
    name: "Sphere", 
    type: "model",
    preview: "🔴",
    code: `{
  "type": "sphere",
  "position": [0, 0, 0],
  "scale": [1, 1, 1],
  "material": "basic"
}`
  },
  {
    id: "plane",
    name: "Plane",
    type: "model",
    preview: "📄",
    code: `{
  "type": "plane",
  "position": [0, 0, 0],
  "scale": [1, 1, 1],
  "material": "basic"
}`
  },
  {
    id: "red",
    name: "Red Material",
    type: "material",
    preview: "🔴",
    code: `{
  "type": "basic",
  "color": "#ff0000"
}`
  },
  {
    id: "blue",
    name: "Blue Material",
    type: "material",
    preview: "🔵",
    code: `{
  "type": "basic",
  "color": "#0000ff"
}`
  },
  {
    id: "green",
    name: "Green Material",
    type: "material",
    preview: "🟢",
    code: `{
  "type": "basic",
  "color": "#00ff00"
}`
  },
  {
    id: "point-light",
    name: "Point Light",
    type: "light",
    preview: "💡",
    code: `{
  "type": "point",
  "position": [0, 5, 0],
  "intensity": 1,
  "color": "#ffffff"
}`
  },
  {
    id: "directional-light",
    name: "Directional Light",
    type: "light",
    preview: "☀️",
    code: `{
  "type": "directional",
  "position": [5, 5, 5],
  "intensity": 1,
  "color": "#ffffff"
}`
  }
];

interface AssetLibraryProps {
  onAssetDrop: (asset: Asset) => void;
}

export function AssetLibrary({ onAssetDrop }: AssetLibraryProps) {
  const [draggedAsset, setDraggedAsset] = useState<Asset | null>(null);

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    setDraggedAsset(asset);
    e.dataTransfer.setData("text/plain", asset.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setDraggedAsset(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const assetId = e.dataTransfer.getData("text/plain");
    const asset = ASSETS.find(a => a.id === assetId);
    if (asset) {
      onAssetDrop(asset);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
      <h3 className="text-sm font-semibold text-white/80 mb-3">3D Asset Library</h3>
      <div className="grid grid-cols-4 gap-2">
        {ASSETS.map((asset) => (
          <div
            key={asset.id}
            draggable
            onDragStart={(e) => handleDragStart(e, asset)}
            onDragEnd={handleDragEnd}
            className={`
              p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all
              ${draggedAsset?.id === asset.id 
                ? "border-violet-500 bg-violet-500/20" 
                : "border-white/10 bg-white/5 hover:border-white/20"
              }
            `}
          >
            <div className="text-2xl text-center mb-1">{asset.preview}</div>
            <div className="text-xs text-white/60 text-center truncate">{asset.name}</div>
            <div className="text-[10px] text-white/30 text-center">{asset.type}</div>
          </div>
        ))}
      </div>
      
      <div 
        className="mt-4 p-4 border-2 border-dashed border-white/20 rounded-lg text-center cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-white/40 text-sm">Drop 3D assets here to add to your website</div>
        <div className="text-white/20 text-xs mt-1">Drag assets from the library above</div>
      </div>
    </div>
  );
}