'use client';

import dynamic from 'next/dynamic';

interface InteractiveSignpostProps {
  iframeLabel?: string;
  heroMode?: boolean;
}

const Npc3DPreview = dynamic(() => import('./Npc3DPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-cyan-400/20 bg-[#050814] text-sm text-white/45">
      Loading interactive 3D NPC preview…
    </div>
  ),
});

/**
 * Compatibility wrapper kept so existing homepage imports remain stable while
 * the old static Wonderland signpost experience is replaced by the real 3D
 * NPC preview. `heroMode` is retained for API compatibility with older callers.
 */
export default function InteractiveSignpost({ iframeLabel }: InteractiveSignpostProps) {
  return <Npc3DPreview iframeLabel={iframeLabel} />;
}
