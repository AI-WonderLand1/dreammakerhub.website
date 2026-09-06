'use client';

import dynamic from 'next/dynamic';

interface InteractiveSignpostProps {
  iframeLabel?: string;
  heroMode?: boolean;
}

const NpcExperiencePreview = dynamic(() => import('./NpcExperiencePreview'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[570px] items-center justify-center rounded-[30px] border border-cyan-400/20 bg-[#050814] text-sm text-white/45">
      Loading rigged 3D NPC preview…
    </div>
  ),
});

/**
 * Compatibility wrapper retained so the homepage integration remains stable.
 * The former static Wonderland signpost has been replaced by a real rigged,
 * animated WebGL NPC product preview.
 */
export default function InteractiveSignpost({ iframeLabel }: InteractiveSignpostProps) {
  return <NpcExperiencePreview iframeLabel={iframeLabel} />;
}
