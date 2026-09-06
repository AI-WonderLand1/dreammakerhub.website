'use client';

import Npc3DPreview from './Npc3DPreview';

interface InteractiveSignpostProps {
  iframeLabel?: string;
  heroMode?: boolean;
}

/**
 * Compatibility wrapper kept so existing homepage imports remain stable while
 * the old static Wonderland signpost experience is replaced by the real 3D
 * NPC preview. `heroMode` is retained for API compatibility with older callers.
 */
export default function InteractiveSignpost({ iframeLabel }: InteractiveSignpostProps) {
  return <Npc3DPreview iframeLabel={iframeLabel} />;
}
