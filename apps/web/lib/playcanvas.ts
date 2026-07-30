export type PlayCanvasMode = "direct" | "iframe";

export function buildPlayCanvasEditorUrl(sceneId?: string | null) {
  const trimmed = sceneId?.trim() ?? "";
  return trimmed ? `/playcanvas/scene/${encodeURIComponent(trimmed)}` : "/playcanvas";
}

export function getPlayCanvasMode(): PlayCanvasMode {
  const raw = process.env.NEXT_PUBLIC_PLAYCANVAS_MODE?.trim().toLowerCase();
  if (raw === "iframe") return "iframe";
  return "direct";
}
