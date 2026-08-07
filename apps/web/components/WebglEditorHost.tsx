"use client";

import { DirectWebglHost } from "@/components/DirectWebglHost";
import { logger } from '@/lib/logger';

export type WebglHostStatus = "bootstrapping" | "mounting" | "ready" | "failed";

export type WebglHostProps = {
  sceneId: string;
  onReady?: () => void;
  onError?: (error?: Error) => void;
  onStatus?: (status: WebglHostStatus) => void;
  onSceneChange?: (scene: unknown) => void;
};

export default function WebglEditorHost(props: WebglHostProps) {
  return <DirectWebglHost {...props} />;
}