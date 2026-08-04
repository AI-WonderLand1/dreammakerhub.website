import { engineManager } from './runtime/engine-manager';
import { logger } from '@lib/logger';

export { engineManager } from './runtime/engine-manager';

/**
 * Automatically registers all available engine adapters.
 * Uses dynamic imports to support both browser and server environments.
 */
export async function registerAllAdapters(): Promise<void> {
  // PlayCanvas
  try {
    const { PlayCanvasAdapter } = await import('./adapters/playcanvas');
    engineManager.registerAdapter(new PlayCanvasAdapter());
    logger.info('[EngineCore] PlayCanvas adapter registered.');
  } catch (e) {
    logger.warn('[EngineCore] Could not register PlayCanvas adapter (likely running in non-browser environment)');
  }

  // WebGL
  try {
    const { WebGLAdapter } = await import('./adapters/webgl');
    engineManager.registerAdapter(new WebGLAdapter());
    logger.info('[EngineCore] WebGL adapter registered.');
  } catch (e) {
    logger.warn('[EngineCore] Could not register WebGL adapter');
  }

  // Three.js / React Three Fiber
  try {
    const { ThreeJSAdapter } = await import('./adapters/threejs');
    engineManager.registerAdapter(new ThreeJSAdapter());
    logger.info('[EngineCore] Three.js adapter registered.');
  } catch (e) {
    logger.warn('[EngineCore] Could not register Three.js adapter');
  }

  // DreamMakerHub Spatial Engine (Gaussian Splatting default) — additive only.
  try {
    const { SpatialAdapter } = await import('./adapters/spatial');
    engineManager.registerAdapter(new SpatialAdapter());
    logger.info('[EngineCore] DreamMakerHub Spatial Engine adapter registered.');
  } catch (e) {
    logger.warn('[EngineCore] Could not register Spatial Engine adapter');
  }
}

