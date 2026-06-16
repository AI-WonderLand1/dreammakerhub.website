'use client';

<<<<<<< HEAD
import { useEffect, useRef, useState } from 'react';
=======
import { useEffect, useRef, useState, useCallback } from 'react';
import { saveSceneToSupabase, loadSceneFromSupabase, listUserScenes } from '@/lib/scene/supabase-store';
import { searchExternalAssets, downloadAssetToStorage, type ExternalAsset } from '@/lib/ai/assetLibrary';
import { useAuth } from '@/lib/supabase/auth-context';
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

const BASE = '/webglstudio/webglstudio.js-master/editor';

const STYLES = [
  `${BASE}/css/style.css`,
  `${BASE}/css/litegui.css`,
  `${BASE}/css/litegraph.css`,
];

const SCRIPTS = [
  `${BASE}/js/extra/jscolor/jscolor.js`,
  `${BASE}/js/extra/gl-matrix-min.js`,
<<<<<<< HEAD
  `${BASE}/js/extra/litegl.js`,     // MUST load before litegui.js (defines LEvent)
  `${BASE}/js/extra/litegraph.js`,   // MUST load before litescene.js
=======
  `${BASE}/js/extra/litegl.js`,
  `${BASE}/js/extra/litegraph.js`,
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  `${BASE}/js/extra/canvas-to-blob.js`,
  `${BASE}/js/extra/pako.js`,
  `${BASE}/js/extra/litescene.js`,
  `${BASE}/js/extra/litegui.js`,
  `${BASE}/js/extra/jszip.js`,
  `${BASE}/js/utils/utils.js`,
  `${BASE}/js/core.js`,
];

function loadStyle(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load style: ${href}`));
    document.head.appendChild(link);
  });
}

const loadedScripts = new Set<string>();
<<<<<<< HEAD
const initializedGlobals = new Set<string>();
=======
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (loadedScripts.has(src)) {
      resolve();
      return;
    }
<<<<<<< HEAD
    
=======
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
<<<<<<< HEAD
    
=======
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    loadedScripts.add(src);
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

function sanitizeGlobals() {
  const dangerous = ['getRay', 'template', 'Core', 'GL', 'Graph'];
  dangerous.forEach(prop => {
    if (!(window as any)[prop + '_initialized']) {
      (window as any)[prop + '_initialized'] = true;
    }
  });
}

interface WebGLStudioHostProps {
<<<<<<< HEAD
  onReady?: () => void;
  onError?: (err: Error) => void;
}

export default function WebGLStudioHost({ onReady, onError }: WebGLStudioHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
=======
  initialSceneId?: string;
  onReady?: () => void;
  onError?: () => void;
}

type SceneEntry = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export default function WebGLStudioHost({ initialSceneId, onReady, onError }: WebGLStudioHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<any>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState<string | null>(initialSceneId ?? null);
  const [sceneName, setSceneName] = useState('Untitled');
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<ExternalAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetSearching, setAssetSearching] = useState(false);
  const [userScenes, setUserScenes] = useState<SceneEntry[]>([]);
  const [showScenes, setShowScenes] = useState(false);
  const [importingAsset, setImportingAsset] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      listUserScenes(user.id).then(setUserScenes);
    }
  }, [user]);

  const getSceneData = useCallback(() => {
    const core = coreRef.current;
    if (!core || typeof core.getSceneData !== 'function') return null;
    return {
      scene: core.getSceneData(),
      objects: core.getObjects ? core.getObjects() : [],
      materials: core.getMaterials ? core.getMaterials() : [],
      timestamp: Date.now(),
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const data = getSceneData();
      if (!data) return;
      const currentId = sceneId || `webgl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await saveSceneToSupabase(currentId, { ...data, name: sceneName }, user.id);
      setSceneId(currentId);
    } finally {
      setSaving(false);
    }
  }, [user, sceneId, sceneName, getSceneData]);

  const handleLoad = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await loadSceneFromSupabase(id);
      if (data && coreRef.current && typeof coreRef.current.loadSceneData === 'function') {
        coreRef.current.loadSceneData((data as any).scene || data);
        setSceneId(id);
        setSceneName((data as any).name || 'Untitled');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNewScene = useCallback(() => {
    if (coreRef.current && typeof coreRef.current.newScene === 'function') {
      coreRef.current.newScene();
    }
    setSceneId(null);
    setSceneName('Untitled');
  }, []);

  const handleSearchAssets = useCallback(async () => {
    setAssetSearching(true);
    try {
      const results = await searchExternalAssets({ query: assetSearch || '3d model', limit: 12 });
      setAssets(results);
    } finally {
      setAssetSearching(false);
    }
  }, [assetSearch]);

  const handleImportAsset = useCallback(async (asset: ExternalAsset) => {
    if (!user) return;
    setImportingAsset(asset.id);
    try {
      const result = await downloadAssetToStorage(asset, user.id);
      if (result.success && result.localUrl && coreRef.current && typeof coreRef.current.importMesh === 'function') {
        coreRef.current.importMesh(result.localUrl);
      }
    } finally {
      setImportingAsset(null);
    }
  }, [user]);
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

  useEffect(() => {
    let cancelled = false;

    async function mount() {
<<<<<<< HEAD
    try {
      sanitizeGlobals();
      
      // Load styles
      for (const href of STYLES) {
        if (cancelled) return;
        await loadStyle(href);
      }

      // Load scripts in order
      for (const src of SCRIPTS) {
        if (cancelled) return;
        await loadScript(src);
      }

        if (cancelled) return;

        // Initialize WebGLStudio — it attaches to document.body by default
        const core = (window as any).CORE;
        if (core && typeof core.init === 'function') {
          core.init();
=======
      try {
        sanitizeGlobals();

        for (const href of STYLES) {
          if (cancelled) return;
          await loadStyle(href);
        }

        for (const src of SCRIPTS) {
          if (cancelled) return;
          await loadScript(src);
        }

        if (cancelled) return;

        const core = (window as any).CORE;
        if (core && typeof core.init === 'function') {
          core.init();
          coreRef.current = core;
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
        }

        if (!cancelled) {
          setLoading(false);
          onReady?.();
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load WebGLStudio';
        setError(msg);
        setLoading(false);
<<<<<<< HEAD
        onError?.(new Error(msg));
=======
        onError?.();
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
      }
    }

    mount();

    return () => {
      cancelled = true;
    };
<<<<<<< HEAD
  }, [onReady, onError]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cyan-400">Loading WebGL Studio...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 z-20">
          <div className="text-center p-4">
            <p className="text-red-400 font-bold mb-2">WebGL Studio failed to load</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}
=======
  }, []);

  useEffect(() => {
    if (!initialSceneId || !coreRef.current) return;
    handleLoad(initialSceneId);
  }, [initialSceneId, handleLoad]);

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      <header className="flex items-center gap-2 border-b border-white/10 bg-black/60 px-4 py-2">
        <button
          onClick={handleNewScene}
          className="rounded px-3 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
        >
          New
        </button>

        <div className="flex items-center gap-1">
          <input
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            className="w-40 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !user}
          className="rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowScenes(!showScenes)}
            className="rounded px-3 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            Load
          </button>
          {showScenes && (
            <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-white/10 bg-[#1a1a2e] shadow-xl">
              <div className="max-h-64 overflow-y-auto p-2">
                {userScenes.length === 0 && (
                  <p className="p-2 text-xs text-white/40">No saved scenes</p>
                )}
                {userScenes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { handleLoad(s.id); setShowScenes(false); }}
                    className="w-full rounded px-2 py-1.5 text-left text-xs text-white/70 hover:bg-white/10"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-[10px] text-white/30">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <input
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchAssets(); }}
            placeholder="Search 3D assets..."
            className="w-44 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/30"
          />
          <button
            onClick={handleSearchAssets}
            disabled={assetSearching}
            className="rounded bg-violet-600 px-2 py-1 text-xs text-white hover:bg-violet-500 disabled:opacity-40"
          >
            {assetSearching ? '...' : 'Search'}
          </button>
        </div>
      </header>

      {assets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 bg-black/40 p-2">
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => handleImportAsset(asset)}
              disabled={importingAsset === asset.id}
              className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-2 hover:border-violet-500/50 disabled:opacity-40"
            >
              {asset.thumbnailUrl ? (
                <img src={asset.thumbnailUrl} alt={asset.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-lg">🎨</div>
              )}
              <span className="max-w-20 truncate text-[10px] text-white/60">{asset.name}</span>
            </button>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
              <p className="text-cyan-400">Loading WebGL Studio...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-500/10">
            <div className="p-4 text-center">
              <p className="mb-2 font-bold text-red-400">WebGL Studio failed to load</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}
      </div>
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    </div>
  );
}
