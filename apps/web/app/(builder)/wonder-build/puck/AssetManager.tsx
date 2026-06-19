"use client";

import { useState, useCallback, useRef } from "react";
import {
  Image, Upload, Trash2, X, Loader2, Link, FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Asset {
  id: string;
  name: string;
  url: string;
  type: "upload" | "url" | "stock";
  size?: number;
  timestamp: number;
}

interface AssetManagerProps {
  onInsertAsset?: (url: string, name: string) => void;
}

const STORAGE_KEY = "puck-assets";

function loadAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistAssets(assets: Asset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export function AssetManager({ onInsertAsset }: AssetManagerProps) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => setAssets(loadAssets()), []);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const newAsset: Asset = {
        id: `asset-${Date.now()}`,
        name: file.name,
        url: dataUrl,
        type: "upload",
        size: file.size,
        timestamp: Date.now(),
      };
      const updated = [...assets, newAsset];
      setAssets(updated);
      persistAssets(updated);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  }, [assets]);

  const handleAddUrl = useCallback(() => {
    if (!urlInput.trim()) return;
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: urlInput.split("/").pop() || "External Image",
      url: urlInput.trim(),
      type: "url",
      timestamp: Date.now(),
    };
    const updated = [...assets, newAsset];
    setAssets(updated);
    persistAssets(updated);
    setUrlInput("");
  }, [urlInput, assets]);

  const handleDelete = useCallback((id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    persistAssets(updated);
  }, [assets]);

  const handleStockPhoto = useCallback(async () => {
    setImporting(true);
    try {
      const query = ["abstract", "nature", "tech", "business", "city"][Math.floor(Math.random() * 5)];
      const res = await fetch(`https://source.unsplash.com/400x300/?${query}`);
      const url = res.url;
      const newAsset: Asset = {
        id: `asset-${Date.now()}`,
        name: `Stock ${query}`,
        url,
        type: "stock",
        timestamp: Date.now(),
      };
      const updated = [...assets, newAsset];
      setAssets(updated);
      persistAssets(updated);
    } finally {
      setImporting(false);
    }
  }, [assets]);

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); refresh(); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
        title="Asset Manager"
      >
        <Image className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Assets</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">Asset Manager</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              id="asset-upload"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="border-white/10 text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              Upload Image
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStockPhoto}
              disabled={importing}
              className="border-white/10 text-xs"
            >
              {importing ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Image className="w-3.5 h-3.5 mr-1" />
              )}
              Stock Photo
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              size={1}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL..."
              className="flex-1 text-xs h-8"
              onKeyDown={(e) => { if (e.key === "Enter") handleAddUrl(); }}
            />
            <Button size="sm" onClick={handleAddUrl} disabled={!urlInput.trim()}>
              <Link className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {assets.length === 0 ? (
            <div className="text-center py-8">
              <FileImage className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No assets yet</p>
              <p className="text-white/20 text-xs mt-1">
                Upload images or add from URL
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5"
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff20'><rect width='24' height='24'/></svg>";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => onInsertAsset?.(asset.url, asset.name)}
                      className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                      title="Insert"
                    >
                      <Image className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-[10px] text-white/70 truncate">{asset.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
