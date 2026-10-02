"use client";

import { DirectPlayCanvasHost } from "@/components/DirectPlayCanvasHost";
import { logger } from '@/lib/logger';

export type PlayCanvasHostStatus = "bootstrapping" | "mounting" | "ready" | "failed";

export type PlayCanvasNpcPlacement = {
  id: string;
  name: string;
  modelUrl?: string | null;
  position?: number[] | null;
  rotation?: number[] | null;
};

export type PlayCanvasHostInstance = {
  placeNpc?: (npc: PlayCanvasNpcPlacement) => void;
  getScene?: () => Promise<unknown>;
};

export type PlayCanvasHostProps = {
  sceneId: string;
  onReady?: () => void;
  onError?: (error?: Error) => void;
  onStatus?: (status: PlayCanvasHostStatus) => void;
  onSceneChange?: (scene: unknown) => void;
  onInstance?: (instance: PlayCanvasHostInstance | null) => void;
};

export default function PlayCanvasEditorHost(props: PlayCanvasHostProps) {
  return <DirectPlayCanvasHost {...props} />;
}
