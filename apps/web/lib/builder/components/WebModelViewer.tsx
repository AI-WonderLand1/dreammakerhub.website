'use client';

import { Component, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei';

function isSafeModelUrl(value: string): boolean {
  const raw = value.trim();
  if (!raw) return false;
  if (raw.startsWith('/')) return /\.(?:glb|gltf)(?:\?.*)?$/i.test(raw);
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && /\.(?:glb|gltf)(?:\?.*)?$/i.test(url.pathname + url.search);
  } catch {
    return false;
  }
}

function Model({ src }: { src: string }) {
  const gltf = useGLTF(src);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return (
    <Bounds fit clip observe margin={1.15}>
      <primitive object={scene} />
    </Bounds>
  );
}

class ModelErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ViewerMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center px-6 text-center">
      <div className="max-w-xs rounded-xl border border-violet-300/15 bg-black/20 px-5 py-4 text-[11px] leading-5 text-white/45">
        <div className="mb-2 text-2xl text-violet-300">◈</div>
        {children}
      </div>
    </div>
  );
}

export default function WebModelViewer({
  src,
  alt = 'Interactive 3D model',
  autoRotate = true,
  controls = true,
  background = '#050816',
}: {
  src?: string;
  alt?: string;
  autoRotate?: boolean;
  controls?: boolean;
  background?: string;
}) {
  const safeSrc = typeof src === 'string' && isSafeModelUrl(src) ? src.trim() : '';

  if (!safeSrc) {
    return (
      <div className="h-full w-full" style={{ background }} role="img" aria-label={alt}>
        <ViewerMessage>Add a trusted HTTPS or site-local .glb/.gltf URL from Assets to display a 3D model here.</ViewerMessage>
      </div>
    );
  }

  const fallback = (
    <div className="h-full w-full" style={{ background }} role="img" aria-label={alt}>
      <ViewerMessage>The model could not be loaded. Check the GLB/GLTF URL and CORS permissions.</ViewerMessage>
    </div>
  );

  return (
    <div className="h-full w-full" style={{ background }} role="img" aria-label={alt}>
      <ModelErrorBoundary fallback={fallback}>
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 1.5]}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[4, 6, 5]} intensity={2.5} />
          <directionalLight position={[-3, 2, -2]} intensity={1.2} />
          <Suspense fallback={null}>
            <Model src={safeSrc} />
          </Suspense>
          <OrbitControls
            enabled={controls}
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
            minDistance={0.5}
            maxDistance={20}
          />
        </Canvas>
      </ModelErrorBoundary>
    </div>
  );
}
