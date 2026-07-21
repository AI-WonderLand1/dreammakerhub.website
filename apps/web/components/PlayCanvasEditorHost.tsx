"use client";

import { DirectPlayCanvasHost } from "@/components/DirectPlayCanvasHost";
import { logger } from '@/lib/logger';

export type PlayCanvasHostStatus = "bootstrapping" | "mounting" | "ready" | "failed";

export type PlayCanvasHostProps = {
  sceneId: string;
  onReady?: () => void;
  onError?: (error?: Error) => void;
  onStatus?: (status: PlayCanvasHostStatus) => void;
};

export default function PlayCanvasEditorHost(props: PlayCanvasHostProps) {
  return <DirectPlayCanvasHost {...props} />;
}
