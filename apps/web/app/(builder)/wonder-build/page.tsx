'use client';

import { Suspense } from 'react';
import TemplateLibraryApp from '@/lib/wonder-build/template-library/App';

export default function WonderBuildHub() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          <p className="text-sm text-white/40">Loading template library…</p>
        </div>
      </div>
    }>
      <TemplateLibraryApp />
    </Suspense>
  );
}
