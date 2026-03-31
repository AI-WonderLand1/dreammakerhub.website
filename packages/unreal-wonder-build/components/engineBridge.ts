// import * as pc from 'playcanvas';
// TODO: Fallback: This logic moved to _FALLBACK_VAULT.

export type EngineBridge = {
  app: unknown;
  loadContainerAsset: (assetUrl: string) => Promise<unknown>;
  unloadAsset: (asset: unknown) => void;
  destroy: () => void;
};

export function createPlayCanvasBridge(): EngineBridge {
  throw new Error('TODO: Fallback: This logic moved to _FALLBACK_VAULT.');
}
