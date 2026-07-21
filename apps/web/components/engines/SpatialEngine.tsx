'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SpatialAdapter } from '@engine/core/adapters/spatial/adapter';
import type { SpatialWorld } from '@engine/core/adapters/spatial/worldLoader';
import type { EngineInstance } from '@engine/core/adapters/types';
import { logger } from '@/lib/logger';

interface SpatialEngineProps {
  engineState?: any;
  onStateChange?: (state: any) => void;
}

type ViewMode = 'landing' | 'viewer' | 'upload';

export default function SpatialEngine({ engineState, onStateChange }: SpatialEngineProps) {
  const [view, setView] = useState<ViewMode>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instanceRef = useRef<EngineInstance | null>(null);
  const adapterRef = useRef<SpatialAdapter | null>(null);

  useEffect(() => {
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  const initEngine = useCallback(async (world: SpatialWorld) => {
    if (!canvasRef.current) return;

    await instanceRef.current?.destroy();

    const adapter = new SpatialAdapter();
    adapterRef.current = adapter;

    const instance = await adapter.create({
      canvas: canvasRef.current as any,
      world,
    });

    instanceRef.current = instance;
  }, []);

  const handleQuickStart = useCallback(async () => {
    if (!canvasRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const world: SpatialWorld = {
        version: 1,
        name: 'Quick Start',
        assets: [],
        nodes: [
          {
            id: 'camera',
            type: 'camera',
            position: [0, 1, 5],
            props: { fov: 75, near: 0.1, far: 1000 },
          },
          {
            id: 'ambient',
            type: 'light',
            props: { color: '#ffffff', intensity: 0.5 },
          },
          {
            id: 'directional',
            type: 'light',
            position: [1, -1, 0.5],
            props: { color: '#ffffff', intensity: 1, castShadow: true },
          },
        ],
        environment: { background: '#000000', ground: true },
        settings: { defaultRenderer: 'three' },
      };
      await initEngine(world);
      setView('viewer');
      onStateChange?.({ view: 'viewer', sceneId: 'quick-start' });
    } catch (err: any) {
      setError(err.message || 'Failed to initialize spatial engine');
    } finally {
      setLoading(false);
    }
  }, [initEngine, onStateChange]);

  const loadFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'ply' && ext !== 'splat' && ext !== 'glb' && ext !== 'gltf') {
      setError('Unsupported file type. Use .ply, .splat, .glb, or .gltf');
      return;
    }
    if (!canvasRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      const isSplat = ext === 'ply' || ext === 'splat';

      const world: SpatialWorld = {
        version: 1,
        name: file.name,
        assets: [
          {
            id: 'loaded-file',
            url,
            kind: isSplat ? 'splat' : 'model',
            format: ext as any,
            label: file.name,
          },
        ],
        nodes: isSplat
          ? []
          : [
              {
                id: 'loaded-mesh',
                type: 'mesh',
                assetRef: 'loaded-file',
              },
            ],
        environment: { background: '#000000' },
        settings: { defaultRenderer: isSplat ? 'splat' : 'three' },
      };

      await initEngine(world);
      setCurrentFile(file.name);
      setView('viewer');
      onStateChange?.({ view: 'viewer', file: file.name });
    } catch (err: any) {
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }, [initEngine, onStateChange]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleBackToLanding = useCallback(() => {
    instanceRef.current?.destroy();
    instanceRef.current = null;
    setView('landing');
    setCurrentFile(null);
    setError(null);
    onStateChange?.({ view: 'landing' });
  }, [onStateChange]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-hidden">
      {view === 'landing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-lg w-full space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                🌌 Spatial Engine
              </h1>
              <p className="text-white/60 text-sm">
                Gaussian Splatting + Three.js — immersive 3D worlds
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleQuickStart}
                disabled={loading}
                className="w-full py-4 rounded-lg font-semibold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Initializing...
                  </span>
                ) : (
                  '⚡ Quick Start (Recommended)'
                )}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-3 rounded-lg font-mono text-sm border border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all"
              >
                📁 Open .ply / .splat / .glb
              </button>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center text-white/40 text-sm hover:border-cyan-500/30 hover:text-white/60 transition-all cursor-pointer"
              >
                Drag & drop a splat file here
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".ply,.splat,.glb,.gltf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {(view === 'viewer' || view === 'upload') && (
        <>
          <div className="border-b border-white/10 px-4 py-2 flex items-center justify-between bg-black/50">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToLanding}
                className="text-white/60 hover:text-white text-sm"
              >
                ← Back
              </button>
              <span className="text-white/30">|</span>
              <span className="text-cyan-400 text-sm font-mono">
                {currentFile || 'Empty Scene'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="neon-button text-xs"
              >
                📁 Open File
              </button>
              <button
                onClick={() => setView('upload')}
                className="neon-button text-xs"
              >
                📤 Upload to Train
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <div
              ref={canvasRef}
              className="w-full h-full"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-cyan-400 font-mono text-sm">Loading splat...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline">
                  dismiss
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'upload' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-cyan-400">Upload for Training</h2>
            <p className="text-white/60 text-sm">
              Upload photos or videos to train a Gaussian Splat of your scene.
            </p>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center text-white/40 text-sm">
              📷 Drag photos/videos here or{' '}
              <button className="text-cyan-400 underline">browse</button>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setView('viewer')}
                className="px-4 py-2 rounded text-sm border border-white/20 hover:bg-white/5"
              >
                Cancel
              </button>
              <button className="neon-button text-sm">
                🚀 Start Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
