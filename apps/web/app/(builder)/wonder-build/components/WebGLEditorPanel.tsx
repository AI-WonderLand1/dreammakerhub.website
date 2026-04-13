'use client';

import dynamic from 'next/dynamic';

const WebGLStudioHost = dynamic(() => import('@/components/WebGLStudioHost'), { ssr: false });

export function WebGLEditorPanel() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#111]">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/80 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          WebGL Editor
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <WebGLStudioHost />
      </div>
    </div>
  );
}
