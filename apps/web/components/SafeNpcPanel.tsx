"use client";

import { lazy, Suspense } from "react";
import type { AiNpcProvider } from "@/lib/ai/convaiNpcProvider";
import { logger } from '@/lib/logger';

type SafeNpcPanelProps = {
  provider: AiNpcProvider;
  onProviderError: (message: string) => void;
};

const NpcPanel = lazy(() => import("./NpcPanel"));

export default function SafeNpcPanel({ provider, onProviderError }: SafeNpcPanelProps) {
  const npcEnabled = process.env.NEXT_PUBLIC_ENABLE_CONVAI_NPC === "true";

  if (!npcEnabled) return null;

  return (
    <Suspense fallback={<div className="p-4 text-sm text-white/50">Loading NPC...</div>}>
      <NpcPanel provider={provider} onProviderError={onProviderError} />
    </Suspense>
  );
}
