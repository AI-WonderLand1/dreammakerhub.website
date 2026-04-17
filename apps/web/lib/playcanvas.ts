export type PlayCanvasMode = "direct";

export function buildPlayCanvasEditorUrl(sceneId?: string | null) {
  const trimmed = sceneId?.trim() ?? "";
  return trimmed ? `/playcanvas/scene/${encodeURIComponent(trimmed)}` : "/playcanvas";
}

export function getPlayCanvasMode(): PlayCanvasMode {
  return "direct";
}

export function supportsPlayCanvasEditorUrl() {
  return false;
}
