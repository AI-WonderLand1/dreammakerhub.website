export type PlayCanvasMode = "iframe" | "direct";

const PLAYCANVAS_ORIGIN = "https://playcanvas.com";

export function buildPlayCanvasEditorUrl(sceneId?: string | null) {
  const trimmed = sceneId?.trim() ?? "";
  if (!trimmed) return `${PLAYCANVAS_ORIGIN}/editor`;
  return `${PLAYCANVAS_ORIGIN}/editor/scene/${encodeURIComponent(trimmed)}?use_local_frontend`;
}

export function getPlayCanvasIframeTargetOrigin() {
  return PLAYCANVAS_ORIGIN;
}

export function isTrustedPlayCanvasOrigin(origin: string) {
  return origin === PLAYCANVAS_ORIGIN;
}

export function getPlayCanvasMode(rawMode = process.env.NEXT_PUBLIC_PLAYCANVAS_MODE): PlayCanvasMode {
  return rawMode === "direct" ? "direct" : "iframe";
}

export function supportsPlayCanvasEditorUrl(mode = getPlayCanvasMode()) {
  return mode === "iframe";
}
