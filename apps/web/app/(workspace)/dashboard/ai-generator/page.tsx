import React, { Suspense } from 'react';
import { SandboxStudio } from '@/lib/wonder3d/components/SandboxStudio';

export const metadata = {
  title: '3D AI Generator | AI WONDERLAND',
  description: 'Generate real GLB models with the Wonderland 3D agent.',
};

export default function AIGeneratorPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading 3D generator…</p>}><SandboxStudio availableAssets={[]} /></Suspense>;
}
