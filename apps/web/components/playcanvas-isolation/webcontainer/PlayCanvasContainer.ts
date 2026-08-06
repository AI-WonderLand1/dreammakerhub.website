import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import type { UserSession, WebContainerInstance } from '../types/isolation';
import { hashForIsolation } from '../utils/hashing';
import { logger } from '@/lib/logger';

// Default PlayCanvas project structure
const DEFAULT_PLAYCANVAS_PROJECT: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify(
        {
          name: 'playcanvas-isolated-project',
          version: '1.0.0',
          type: 'module',
          scripts: {
            serve: 'node server.js',
          },
          dependencies: {
            express: 'latest',
            'playcanvas': '^2.17.0',
          },
        },
        null,
        2
      ),
    },
  },
  '.ssh': {
    directory: {
      'authorized_keys': {
        file: {
          contents: '# Auto-generated authorized_keys\n# AI Wonderland SSH keys injected here',
        },
      },
    },
  },
  'server.js': {
    file: {
      contents: `import express from 'express';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// PlayCanvas UI container (WebGL Studio)
app.get('/playcanvas/editor-ui', (req, res) => {
  const editorHtml = readFileSync('./editor-ui/index.html', 'utf-8');
  res.send(editorHtml);
});

// PlayCanvas Engine container (separate, can restart independently)
app.get('/playcanvas/engine', (req, res) => {
  const engineHtml = readFileSync('./editor-engine/index.html', 'utf-8');
  res.send(engineHtml);
});

// Serve the locally-installed PlayCanvas engine bundle (no playcanvas.com CDN)
app.get('/playcanvas/engine/playcanvas.mjs', (req, res) => {
  const engineFile = join(process.cwd(), 'node_modules/playcanvas/build/playcanvas.mjs');
  if (existsSync(engineFile)) {
    res.type('application/javascript');
    res.sendFile(engineFile);
  } else {
    res.status(404).json({ error: 'Local engine bundle not found' });
  }
});

// Legacy route for backward compatibility
app.get('/playcanvas/editor', (req, res) => {
  const editorHtml = readFileSync('./editor-ui/index.html', 'utf-8');
  res.send(editorHtml);
});

app.get('/playcanvas/api/scenes/:sceneId', (req, res) => {
  const scenePath = join('./scenes', req.params.sceneId + '.json');
  if (existsSync(scenePath)) {
    const sceneData = readFileSync(scenePath, 'utf-8');
    res.json(JSON.parse(sceneData));
  } else {
    res.status(404).json({ error: 'Scene not found' });
  }
});

app.post('/playcanvas/api/scenes/:sceneId', (req, res) => {
  const scenePath = join('./scenes', req.params.sceneId + '.json');
  mkdirSync('./scenes', { recursive: true });
  writeFileSync(scenePath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Inject SSH public key into authorized_keys (runtime)
app.post('/playcanvas/api/ssh/inject', (req, res) => {
  const { publicKey, userId } = req.body;
  if (!publicKey || !userId) {
    res.status(400).json({ error: 'Missing publicKey or userId' });
    return;
  }
  const sshDir = join('.ssh');
  const authKeysFile = join(sshDir, 'authorized_keys');
  mkdirSync(sshDir, { recursive: true });
  
  const existingKeys = existsSync(authKeysFile) ? readFileSync(authKeysFile, 'utf-8') : '';
  const timestamp = new Date().toISOString();
  const keyComment = '# ' + userId + ' @ ' + timestamp + '\n';
  const newKeyBlock = keyComment + publicKey + '\n';
  
  // Check if key already exists (avoid duplicates)
  if (existingKeys.includes(publicKey.substring(0, 20))) {
    res.json({ success: true, message: 'Key already exists' });
    return;
  }
  
  writeFileSync(authKeysFile, existingKeys + newKeyBlock);
  res.json({ success: true, message: 'SSH key injected' });
});

// Get desired scene state — reads from local filesystem inside the WebContainer sandbox
app.get('/playcanvas/api/state/:sceneId', (req, res) => {
  const scenePath = join('./scenes', req.params.sceneId + '.json');
  if (existsSync(scenePath)) {
    const sceneData = JSON.parse(readFileSync(scenePath, 'utf-8'));
    res.json({ state: sceneData, source: 'local' });
  } else {
    // Return default desired state
    res.json({ 
      state: {
        name: req.params.sceneId,
        objects: [],
        settings: { ambientLight: 0.2 }
      },
      source: 'default'
    });
  }
});

// Sync local state with desired state (reconciliation)
app.post('/playcanvas/api/sync/:sceneId', (req, res) => {
  const scenePath = join('./scenes', req.params.sceneId + '.json');
  const localState = existsSync(scenePath) ? JSON.parse(readFileSync(scenePath, 'utf-8')) : {};
  const desiredState = req.body;
  
  // Simple reconciliation: merge desired into local
  const reconciled = { ...localState, ...desiredState, lastSync: new Date().toISOString() };
  
  mkdirSync('./scenes', { recursive: true });
  writeFileSync(scenePath, JSON.stringify(reconciled, null, 2));
  res.json({ success: true, reconciled });
});

// Serve main page
app.get('/', (req, res) => {
  res.send(\`
    <html>
      <head>
        <title>Isolated PlayCanvas Editor</title>
        <style>
          body { margin: 0; padding: 0; background: #1a1a1a; color: white; }
          #editor { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="editor"></div>
        <script type="module">
          // Load PlayCanvas editor
          import { app } from './playcanvas/editor.js';
          app.start('#editor');
        </script>
      </body>
    </html>
  \`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`PlayCanvas isolated server running on port \${PORT}\`);
});
`,
    },
  },
  'editor-ui': {
    directory: {
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html>
<head>
  <title>WonderPlay 3D Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d0d14; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }
    #studio { width: 100vw; height: 100vh; display: flex; }
    
    /* Toolbar */
    .toolbar {
      position: fixed; top: 0; left: 0; right: 0; height: 48px;
      background: linear-gradient(180deg, #1a1a2e 0%, #12121f 100%);
      border-bottom: 1px solid #2a2a4a; display: flex; align-items: center;
      padding: 0 16px; gap: 8px; z-index: 100;
    }
    .toolbar-btn {
      padding: 6px 12px; background: #252540; border: 1px solid #3a3a5a;
      border-radius: 4px; color: #00d9ff; font-size: 12px; cursor: pointer;
      transition: all 0.2s;
    }
    .toolbar-btn:hover { background: #2a2a50; border-color: #00d9ff; }
    .toolbar-btn.active { background: #00d9ff; color: #0d0d14; }
    
    /* Viewport */
    .viewport {
      position: fixed; top: 48px; left: 0; right: 280px; bottom: 0;
      background: #0a0a10;
    }
    .viewport canvas { width: 100%; height: 100%; display: block; }
    
    /* Sidebar */
    .sidebar {
      position: fixed; top: 48px; right: 0; width: 280px; bottom: 0;
      background: #12121f; border-left: 1px solid #2a2a4a;
      padding: 16px; overflow-y: auto;
    }
    .sidebar h3 { color: #00d9ff; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }
    .prop-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .prop-input { flex: 1; background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 4px; padding: 6px; color: #fff; font-size: 12px; }
    
    /* Status bar */
    .status {
      position: fixed; bottom: 0; left: 0; right: 0; height: 24px;
      background: #0a0a10; border-top: 1px solid #2a2a4a;
      display: flex; align-items: center; padding: 0 12px; gap: 16px; font-size: 11px; color: #666;
    }
    .status-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #00ff88;
    }
    .status-dot.error { background: #ff4444; }
    .status-dot.loading { background: #ffaa00; animation: pulse 1s infinite; }
    
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    
    /* Loading */
    .loading-overlay {
      position: fixed; inset: 0; background: #0d0d14;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 16px; z-index: 9999;
    }
    .loading-overlay.hidden { display: none; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #2a2a4a;
      border-top-color: #00d9ff; border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loading-overlay" id="loading">
    <div class="spinner"></div>
    <div style="color: #00d9ff; font-size: 14px;">Starting WonderPlay 3D Studio...</div>
  </div>
  
  <div class="toolbar">
    <span style="color: #00d9ff; font-weight: bold; margin-right: 16px;">WonderPlay 3D</span>
    <button class="toolbar-btn active" data-panel="scene">Scene</button>
    <button class="toolbar-btn" data-panel="objects">Objects</button>
    <button class="toolbar-btn" data-panel="properties">Properties</button>
    <button class="toolbar-btn" onclick="window.restartEngine()">↻ Restart Engine</button>
  </div>
  
  <div class="viewport">
    <canvas id="engine-canvas"></canvas>
  </div>
  
  <div class="sidebar">
    <h3>Transform</h3>
    <div class="prop-row">
      <input class="prop-input" id="pos-x" placeholder="X" value="0">
      <input class="prop-input" id="pos-y" placeholder="Y" value="0">
      <input class="prop-input" id="pos-z" placeholder="Z" value="0">
    </div>
    <h3 style="margin-top: 16px;">Objects</h3>
    <div id="object-list"></div>
  </div>
  
  <div class="status">
    <div class="status-dot" id="engine-status"></div>
    <span id="engine-status-text">Initializing...</span>
    <span style="margin-left: auto;">Engine: <span id="engine-health">--</span></span>
  </div>
  
  <script>
    // Pod Architecture: UI Container + Engine Container
    const ENGINE_URL = '/playcanvas/engine';
    let engineIframe = null;
    let healthCheckInterval = null;
    let engineAlive = false;
    
    // Create engine iframe (separate container)
    function createEngineContainer() {
      const viewport = document.querySelector('.viewport');
      engineIframe = document.createElement('iframe');
      engineIframe.src = ENGINE_URL;
      engineIframe.style.cssText = 'width:100%;height:100%;border:none;background:transparent;';
      engineIframe.id = 'engine-iframe';
      viewport.appendChild(engineIframe);
    }
    
    // Liveness probe - ping engine every 2s
    function startHealthCheck() {
      healthCheckInterval = setInterval(() => {
        if (!engineIframe?.contentWindow) {
          markEngineDead();
          return;
        }
        try {
          engineIframe.contentWindow.postMessage({ type: 'PING' }, '*');
        } catch (e) {
          markEngineDead();
        }
      }, 2000);
    }
    
    function markEngineDead() {
      if (engineAlive) {
        console.log('[Pod] Engine died - marking dead');
        engineAlive = false;
        document.getElementById('engine-status').className = 'status-dot error';
        document.getElementById('engine-status-text').textContent = 'Engine dead - restarting...';
        document.getElementById('engine-health').textContent = 'DEAD';
      }
    }
    
    function markEngineAlive() {
      if (!engineAlive) {
        console.log('[Pod] Engine alive');
        engineAlive = true;
        document.getElementById('engine-status').className = 'status-dot';
        document.getElementById('engine-status-text').textContent = 'Engine running';
        document.getElementById('engine-health').textContent = 'OK';
        document.getElementById('loading').classList.add('hidden');
      }
    }
    
    // Restart engine only (not whole app)
    window.restartEngine = function() {
      console.log('[Pod] Restarting engine container...');
      if (engineIframe) {
        engineIframe.remove();
      }
      document.getElementById('loading').classList.remove('hidden');
      createEngineContainer();
      markEngineDead();
    };
    
    // Handle messages from engine
    window.addEventListener('message', (e) => {
      if (e.data.type === 'PONG') {
        markEngineAlive();
      }
      if (e.data.type === 'ENGINE_READY') {
        markEngineAlive();
      }
      if (e.data.objects) {
        document.getElementById('object-list').innerHTML = 
          e.data.objects.map(o => '<div class="prop-row"><span style="color:#888">'+o.name+'</span></div>').join('');
      }
    });
    
    // Init
    createEngineContainer();
    startHealthCheck();
  </script>
</body>
</html>`,
        },
      },
    },
  },
  'editor-engine': {
    directory: {
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html>
<head>
  <title>PlayCanvas Engine</title>
  <style>
    * { margin: 0; padding: 0; }
    body { background: #0a0a10; overflow: hidden; }
    canvas { width: 100%; height: 100vh; display: block; }
  </style>
</head>
<body>
  <canvas id="engine-canvas"></canvas>
  <script type="module">
    // Engine Container - runs the locally-served PlayCanvas engine
    import * as pc from '/playcanvas/engine/playcanvas.mjs';
    const canvas = document.getElementById('engine-canvas');
    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas)
    });
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    
    // Default scene: grid floor + camera + light
    const camera = new pc.Entity('Camera');
    camera.addComponent('camera', { clearColor: new pc.Color(0.04, 0.04, 0.06) });
    camera.setPosition(0, 8, 15);
    camera.lookAt(0, 0, 0);
    app.root.addChild(camera);
    
    const light = new pc.Entity('Sun');
    light.addComponent('light', { 
      type: 'directional', 
      color: new pc.Color(1, 0.95, 0.8),
      intensity: 1.2 
    });
    light.setEulerAngles(45, 135, 0);
    app.root.addChild(light);
    
    const floor = new pc.Entity('Floor');
    floor.addComponent('render', { type: 'plane' });
    floor.setLocalScale(50, 1, 50);
    const floorMat = new pc.StandardMaterial();
    floorMat.diffuse = new pc.Color(0.1, 0.1, 0.15);
    floorMat.update();
    floor.render.material = floorMat;
    app.root.addChild(floor);
    
    app.start();
    
    // Export for UI container
    window.PlayCanvasEngine = app;
    
    // Health check response
    window.addEventListener('message', (e) => {
      if (e.data.type === 'PING') {
        e.source.postMessage({ type: 'PONG' }, '*');
      }
    });
    
    // Report ready
    if (window.parent) {
      window.parent.postMessage({ type: 'ENGINE_READY', objects: [{name:'Camera'},{name:'Sun'},{name:'Floor'}] }, '*');
    }
    
    console.log('[Engine] PlayCanvas started');
  </script>
</body>
</html>`,
        },
      },
    },
  },
  'scenes': {
    directory: {},
  },
  'public': {
    directory: {
      'assets': {
        directory: {},
      },
    },
  },
};

export class PlayCanvasContainerManager {
  private instances: Map<string, WebContainerInstance> = new Map();
  private userContainerMap: Map<string, string> = new Map(); // userId -> containerId
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private maxInstances: number = 10,
    private instanceTimeoutMs: number = 30 * 60 * 1000, // 30 minutes
    private cleanupIntervalMs: number = 5 * 60 * 1000, // 5 minutes
    private userConfirmClose: boolean = true // Don't delete until user explicitly closes
  ) {
    if (userConfirmClose) {
      // Don't auto-cleanup - wait for explicit destroy call
    } else {
      this.startCleanupInterval();
    }
  }

  private generateContainerId(userId: string): string {
    const hash = hashForIsolation(userId).substring(0, 8);
    return `pc-container-${hash}-${Date.now()}`;
  }

  private hashUserId(userId: string): string {
    return hashForIsolation(userId);
  }

  private async createContainer(userId: string): Promise<WebContainerInstance> {
    // Check instance limit
    if (this.instances.size >= this.maxInstances) {
      await this.cleanupOldestInstance();
    }

    const containerId = this.generateContainerId(userId);
    const hashedId = this.hashUserId(userId);
    
    logger.info(`[PlayCanvasContainer] Booting new container for user ${userId.substring(0, 8)}...`);
    
    const container = await WebContainer.boot({
      workdirName: `playcanvas-${hashedId}`,
    });

    // Mount default project
    await container.mount(DEFAULT_PLAYCANVAS_PROJECT);

    // Start the server
    const process = await container.spawn('npm', ['run', 'serve']);
    
    // Wait for server to be ready
    let serverUrl = '';
    container.on('server-ready', (port, url) => {
      serverUrl = url;
      logger.info(`[PlayCanvasContainer] Server ready at: ${url}`);
    });

    const instance: WebContainerInstance = {
      id: containerId,
      userId,
      container,
      serverUrl: '',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true,
    };

    this.instances.set(containerId, instance);
    this.userContainerMap.set(userId, containerId);

    return instance;
  }

  async getContainer(userId: string): Promise<WebContainerInstance> {
    const existingContainerId = this.userContainerMap.get(userId);
    
    if (existingContainerId) {
      const instance = this.instances.get(existingContainerId);
      if (instance && instance.isActive) {
        instance.lastUsed = Date.now();
        return instance;
      }
    }

    // Create new container
    return await this.createContainer(userId);
  }

  async getContainerById(containerId: string): Promise<WebContainerInstance | null> {
    const instance = this.instances.get(containerId);
    if (instance && instance.isActive) {
      instance.lastUsed = Date.now();
      return instance;
    }
    return null;
  }

  async destroyContainer(containerId: string): Promise<void> {
    const instance = this.instances.get(containerId);
    if (instance) {
      try {
        instance.container.teardown();
        this.instances.delete(containerId);
        this.userContainerMap.delete(instance.userId);
        logger.info('[PlayCanvasContainer] Destroyed container', containerId);
      } catch (error) {
        logger.error('[PlayCanvasContainer] Error destroying container', containerId, error);
      }
    }
  }

  private async cleanupOldestInstance(): Promise<void> {
    let oldest: WebContainerInstance | null = null;
    
    const instancesArray = Array.from(this.instances.values());
    for (const instance of instancesArray) {
      if (!oldest || instance.lastUsed < oldest.lastUsed) {
        oldest = instance;
      }
    }

    if (oldest) {
      await this.destroyContainer(oldest.id);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveInstances();
    }, this.cleanupIntervalMs);
  }

  private async cleanupInactiveInstances(): Promise<void> {
    const now = Date.now();
    const toDestroy: string[] = [];

    const entriesArray = Array.from(this.instances.entries());
    for (const [containerId, instance] of entriesArray) {
      // Don't cleanup if still marked active (user is editing)
      if (instance.isActive) {
        instance.lastUsed = Date.now(); // Keep alive while user is active
        continue;
      }
      if (now - instance.lastUsed > this.instanceTimeoutMs) {
        toDestroy.push(containerId);
      }
    }

    for (const containerId of toDestroy) {
      await this.destroyContainer(containerId);
    }

    if (toDestroy.length > 0) {
      logger.info(`[PlayCanvasContainer] Cleaned up ${toDestroy.length} inactive instances`);
    }
  }

  getInstanceCount(): number {
    return this.instances.size;
  }

  getActiveInstances(): WebContainerInstance[] {
    return Array.from(this.instances.values()).filter(instance => instance.isActive);
  }

  cleanupStuckContainers(timeoutMs: number = 15 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;
    const stuckIds: string[] = [];

    for (const [containerId, instance] of this.instances.entries()) {
      // Check if still trying to boot after timeout
      if (!instance.serverUrl && now - instance.createdAt > timeoutMs) {
        stuckIds.push(containerId);
      }
    }

    for (const id of stuckIds) {
      this.destroyContainer(id);
      cleaned++;
    }

    if (cleaned > 0) {
      logger.info(`[PlayCanvasContainer] Cron cleanup: removed ${cleaned} stuck containers`);
    }

    return cleaned;
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const containerIds = Array.from(this.instances.keys());
    for (const containerId of containerIds) {
      await this.destroyContainer(containerId);
    }
  }
}