// NOTE: The declaration below was injected by `"framer"`
// see https://www.framer.com/docs/guides/handshake for more information.
declare module "https://framer.com/m/*";

type PlayCanvasEditorInstance = {
  destroy: () => void;
  loadScene?: (scene: unknown, sceneId?: string) => void;
  getScene?: () => Promise<unknown>;
  onSceneChange?: (handler: (scene: unknown) => void) => void;
  ready?: Promise<void>;
  iframe?: HTMLIFrameElement;
};

type PlayCanvasBootstrapApi = {
  mount: (container: HTMLElement, options: { sceneId?: string }) => PlayCanvasEditorInstance;
  EDITOR_URL?: string;
};

declare global {
  interface Window {
    PlayCanvasEditorBootstrap?: PlayCanvasBootstrapApi;
  }
}

export {};
