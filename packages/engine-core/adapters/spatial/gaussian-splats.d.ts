declare module '@mkkellogg/gaussian-splats-3d' {
  export class Viewer {
    constructor(options: Record<string, unknown>);
    addSplatScene(url: string, options?: Record<string, unknown>): Promise<unknown>;
    start(): Promise<unknown>;
    dispose(): Promise<void>;
    renderer?: { getContext?: () => WebGLRenderingContext | WebGL2RenderingContext | null };
  }
}
