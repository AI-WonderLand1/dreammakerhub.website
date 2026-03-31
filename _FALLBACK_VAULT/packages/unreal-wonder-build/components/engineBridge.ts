// import * as pc from 'playcanvas';
// TODO: Fallback: This logic moved to _FALLBACK_VAULT.

export type EngineBridge = {
  app: pc.Application;
  loadContainerAsset: (assetUrl: string) => Promise<pc.Entity>;
  unloadAsset: (asset: pc.Asset) => void;
  destroy: () => void;
};

function isRenderEntityResource(resource: unknown): resource is { instantiateRenderEntity: () => pc.Entity } {
  return typeof resource === 'object' && resource !== null && 'instantiateRenderEntity' in resource;
}

export function createPlayCanvasBridge(
  canvas: HTMLCanvasElement,
  options?: {
    isSyncLocked?: () => boolean;
  },
): EngineBridge {
  const app = new pc.Application(canvas, {
    graphicsDeviceOptions: { preserveDrawingBuffer: true, antialias: true },
  });

  app.start();

  const camera = new pc.Entity('Camera');
  camera.addComponent('camera', { clearColor: new pc.Color(0.1, 0.1, 0.1) });
  camera.setPosition(0, 0, 3);
  app.root.addChild(camera);

  const light = new pc.Entity('Light');
  light.addComponent('light', { type: 'directional', intensity: 1.4 });
  light.setEulerAngles(45, 30, 0);
  app.root.addChild(light);

  return {
    app,
    loadContainerAsset: (assetUrl: string) => {
      if (options?.isSyncLocked?.()) {
        throw new Error('Engine is currently locked by SyncGuard: Save changes before loading assets.');
      }

      return new Promise((resolve, reject) => {
        const asset = new pc.Asset('dynamic-asset', 'container', { url: assetUrl });

        asset.once('load', (loadedAsset: pc.Asset) => {
          if (!isRenderEntityResource(loadedAsset.resource)) {
            reject(new Error('Loaded asset resource is not renderable'));
            return;
          }

          const entity = loadedAsset.resource.instantiateRenderEntity();
          app.root.addChild(entity);
          resolve(entity);
        });

        asset.once('error', (err: Error) => reject(err));

        app.assets.add(asset);
        app.assets.load(asset);
      });
    },

    unloadAsset: (asset: pc.Asset) => {
      app.assets.remove(asset);
      asset.unload();
    },

    destroy: () => {
      app.destroy();
    },
  };
}
