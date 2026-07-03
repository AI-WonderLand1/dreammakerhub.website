import type { EngineAdapter, EngineConfig, EngineInstance } from '../types';

export class PlayCanvasAdapter implements EngineAdapter {
  public name = 'playcanvas';

  public async create(config: EngineConfig): Promise<EngineInstance> {
    console.log('[PlayCanvasAdapter] Creating engine instance...');
    
    let pc: any;
    try {
      // Dynamic import to handle environment differences
      pc = await import('playcanvas');
    } catch (e) {
      console.error('[PlayCanvasAdapter] Failed to load playcanvas library. Is it installed?', e);
      throw e;
    }

    const canvas = config.canvas;
    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas),
      elementInput: new pc.ElementInput(canvas),
    });

    app.setCanvasFillMode(pc.FILLMODE_NONE);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.start();

    // Handle resize
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      app.resizeCanvas(rect.width, rect.height);
    };
    window.addEventListener('resize', resize);
    resize();

    // GLTF model support
    let gltfTransform: any = null;
    try {
      gltfTransform = await import('@gltf-transform/core');
    } catch (e) {
      console.warn('[PlayCanvasAdapter] GLTF support not available');
    }

    return {
      name: this.name,
      canvas,
      context: app.graphicsDevice.getContext(),
      device: null, // WebGL doesn't have a WebGPU device
      destroy: async () => {
        console.log('[PlayCanvasAdapter] Destroying instance');
        window.removeEventListener('resize', resize);
        app.destroy();
        if (gltfTransform) {
          // Clean up GLTF resources if any
        }
      },
    };
  }
}
