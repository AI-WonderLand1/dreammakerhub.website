import type { EngineAdapter, EngineConfig, EngineInstance } from '../types';

export class ThreeJSAdapter implements EngineAdapter {
  public name = 'threejs';

  public async create(config: EngineConfig): Promise<EngineInstance> {
    console.log('[ThreeJSAdapter] Creating engine instance...');

    const THREE = await import('three');

    const canvas = config.canvas;
    const width = config.width || canvas.clientWidth || 800;
    const height = config.height || canvas.clientHeight || 600;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    let animationId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      const elapsed = clock.getElapsedTime();
      renderer.render(scene, camera);
      if (config.onFrame) {
        config.onFrame(elapsed * 1000);
      }
    };

    animationId = requestAnimationFrame(function loop(time) {
      renderLoop();
      animationId = requestAnimationFrame(loop);
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 800;
      const h = rect.height || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', resize);
    resize();

    if (config.onReady) {
      config.onReady();
    }

    console.log('[ThreeJSAdapter] Engine instance created successfully');

    return {
      name: this.name,
      canvas,
      context: renderer.getContext() as any,
      device: null,
      destroy: async () => {
        console.log('[ThreeJSAdapter] Destroying instance');
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
        renderer.dispose();
        scene.clear();
      },
    };
  }
}
