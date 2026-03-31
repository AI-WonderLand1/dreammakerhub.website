import { isTrustedPlayCanvasOrigin } from "./playcanvas";

export const PLAYCANVAS_BRIDGE_MESSAGE_TYPES = [
  "bridge:ready",
  "scene:metadata",
  "scene:update",
  "bridge:error",
] as const;

export type PlayCanvasBridgeMessageType = (typeof PLAYCANVAS_BRIDGE_MESSAGE_TYPES)[number];

type BridgeBase<TType extends PlayCanvasBridgeMessageType, TPayload> = {
  type: TType;
  payload: TPayload;
};

export type BridgeReadyMessage = BridgeBase<"bridge:ready", { sceneId?: string }>;

export type SceneMetadataMessage = BridgeBase<
  "scene:metadata",
  {
    sceneId: string;
    name?: string;
    updatedAt?: string;
  }
>;

export type SceneUpdateMessage = BridgeBase<
  "scene:update",
  {
    sceneId: string;
    status?: "idle" | "saving" | "saved" | "error";
    changedKeys?: string[];
  }
>;

export type BridgeErrorMessage = BridgeBase<
  "bridge:error",
  {
    message: string;
    code?: string;
  }
>;

export type PlayCanvasBridgeMessage =
  | BridgeReadyMessage
  | SceneMetadataMessage
  | SceneUpdateMessage
  | BridgeErrorMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function isBridgeReadyMessage(data: unknown): data is BridgeReadyMessage {
  if (!isRecord(data) || data.type !== "bridge:ready" || !isRecord(data.payload)) {
    return false;
  }

  return data.payload.sceneId === undefined || typeof data.payload.sceneId === "string";
}

export function isSceneMetadataMessage(data: unknown): data is SceneMetadataMessage {
  if (!isRecord(data) || data.type !== "scene:metadata" || !isRecord(data.payload)) {
    return false;
  }

  const payload = data.payload;
  if (typeof payload.sceneId !== "string") return false;
  if (payload.name !== undefined && typeof payload.name !== "string") return false;
  if (payload.updatedAt !== undefined && typeof payload.updatedAt !== "string") return false;

  return true;
}

export function isSceneUpdateMessage(data: unknown): data is SceneUpdateMessage {
  if (!isRecord(data) || data.type !== "scene:update" || !isRecord(data.payload)) {
    return false;
  }

  const payload = data.payload;
  if (typeof payload.sceneId !== "string") return false;
  if (
    payload.status !== undefined &&
    !["idle", "saving", "saved", "error"].includes(String(payload.status))
  ) {
    return false;
  }
  if (payload.changedKeys !== undefined && !isStringArray(payload.changedKeys)) return false;

  return true;
}

export function isBridgeErrorMessage(data: unknown): data is BridgeErrorMessage {
  if (!isRecord(data) || data.type !== "bridge:error" || !isRecord(data.payload)) {
    return false;
  }

  const payload = data.payload;
  if (typeof payload.message !== "string") return false;
  if (payload.code !== undefined && typeof payload.code !== "string") return false;

  return true;
}

export function isPlayCanvasBridgeMessage(data: unknown): data is PlayCanvasBridgeMessage {
  return (
    isBridgeReadyMessage(data) ||
    isSceneMetadataMessage(data) ||
    isSceneUpdateMessage(data) ||
    isBridgeErrorMessage(data)
  );
}

export function parsePlayCanvasBridgeMessage(data: unknown): PlayCanvasBridgeMessage | null {
  return isPlayCanvasBridgeMessage(data) ? data : null;
}

export function getBridgeMessageFromEvent(
  event: Pick<MessageEvent, "origin" | "source" | "data">,
  expectedSource: Window | null | undefined,
): PlayCanvasBridgeMessage | null {
  if (!isTrustedPlayCanvasOrigin(event.origin)) return null;
  if (!expectedSource || event.source !== expectedSource) return null;

  return parsePlayCanvasBridgeMessage(event.data);
}

export function sendBridgeMessage(
  targetWindow: Window | null | undefined,
  targetOrigin: string,
  message: PlayCanvasBridgeMessage,
): boolean {
  if (!targetWindow || !isTrustedPlayCanvasOrigin(targetOrigin)) {
    return false;
  }

  targetWindow.postMessage(message, targetOrigin);
  return true;
}
