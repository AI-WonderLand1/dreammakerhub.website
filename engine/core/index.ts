import { engineManager } from './runtime/engine-manager';

export { engineManager } from './runtime/engine-manager';

/**
 * Automatically registers all available engine adapters.
 * Uses dynamic imports to support both browser and server environments.
 */
export async function registerAllAdapters(): Promise<void> {
  // PlayCanvas
  try {
    const { PlayCanvasAdapter } = await import('../adapters/playcanvas');
    engineManager.registerAdapter(new PlayCanvasAdapter());
    console.log('[EngineCore] PlayCanvas adapter registered.');
  } catch (e) {
    console.warn('[EngineCore] Could not register PlayCanvas adapter (likely running in non-browser environment)');
  }

  // WebGL
  try {
    const { WebGLAdapter } = await import('../adapters/webgl');
    engineManager.registerAdapter(new WebGLAdapter());
    console.log('[EngineCore] WebGL adapter registered.');
  } catch (e) {
    console.warn('[EngineCore] Could not register WebGL adapter');
  }
}

