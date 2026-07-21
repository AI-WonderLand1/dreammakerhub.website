// NOTE: The declaration below was injected by `"framer"`
// see https://www.framer.com/docs/guides/handshake for more information.
declare module "https://framer.com/m/*";

type PlayCanvasBootstrapApi = {
  mount: (container: HTMLElement, options: { sceneId: string }) => void | { destroy?: () => void };
};

declare global {
  interface Window {
    PlayCanvasEditorBootstrap?: PlayCanvasBootstrapApi;
  }
}

export {};
