'use client';

import { useEffect, useRef, useState } from 'react';

const BASE = '/webglstudio/webglstudio.js-master/editor';

const STYLES = [
  `${BASE}/css/style.css`,
  `${BASE}/css/litegui.css`,
  `${BASE}/css/litegraph.css`,
];

const SCRIPTS = [
  `${BASE}/js/extra/jscolor/jscolor.js`,
  `${BASE}/js/extra/gl-matrix-min.js`,
  `${BASE}/js/extra/litegl.js`,     // MUST load before litegui.js (defines LEvent)
  `${BASE}/js/extra/litegraph.js`,   // MUST load before litescene.js
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

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (loadedScripts.has(src)) {
      resolve();
      return;
    }
    
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    
    loadedScripts.add(src);
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

interface WebGLStudioHostProps {
  onReady?: () => void;
  onError?: (err: Error) => void;
}

export default function WebGLStudioHost({ onReady, onError }: WebGLStudioHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      try {
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
        onError?.(new Error(msg));
      }
    }

    mount();

    return () => {
      cancelled = true;
    };
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
    </div>
  );
}
