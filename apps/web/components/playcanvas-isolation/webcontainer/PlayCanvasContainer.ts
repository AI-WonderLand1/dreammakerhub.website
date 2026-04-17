import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import type { UserSession, WebContainerInstance } from '../types/isolation';
import { hashForIsolation } from '../utils/hashing';

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

// PlayCanvas editor routes
app.get('/playcanvas/editor', (req, res) => {
  const editorHtml = readFileSync('./editor/index.html', 'utf-8');
  res.send(editorHtml);
});

app.get('/playcanvas/api/scenes/:sceneId', (req, res) => {
  const scenePath = join('./scenes', \`\${req.params.sceneId}.json\`);
  if (existsSync(scenePath)) {
    const sceneData = readFileSync(scenePath, 'utf-8');
    res.json(JSON.parse(sceneData));
  } else {
    res.status(404).json({ error: 'Scene not found' });
  }
});

app.post('/playcanvas/api/scenes/:sceneId', (req, res) => {
  const scenePath = join('./scenes', \`\${req.params.sceneId}.json\`);
  mkdirSync('./scenes', { recursive: true });
  writeFileSync(scenePath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
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
  'editor': {
    directory: {
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html>
<head>
  <title>PlayCanvas Editor</title>
</head>
<body>
  <div id="playcanvas-container"></div>
</body>
</html>`,
        },
      },
      'editor.js': {
        file: {
          contents: `// PlayCanvas Editor stub - would be populated with actual editor code
export const app = {
  start: (selector) => {
    console.log('Starting PlayCanvas editor in:', selector);
    const container = document.querySelector(selector);
    if (container) {
      container.innerHTML = '<div style="padding: 20px; color: #00ff00;">PlayCanvas Editor Isolated Instance</div>';
    }
  }
};`,
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
    private cleanupIntervalMs: number = 5 * 60 * 1000 // 5 minutes
  ) {
    this.startCleanupInterval();
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
    
    console.log(`[PlayCanvasContainer] Booting new container for user ${userId.substring(0, 8)}...`);
    
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
      console.log(`[PlayCanvasContainer] Server ready at: ${url}`);
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
        console.log(`[PlayCanvasContainer] Destroyed container ${containerId}`);
      } catch (error) {
        console.error(`[PlayCanvasContainer] Error destroying container ${containerId}:`, error);
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
      if (now - instance.lastUsed > this.instanceTimeoutMs) {
        toDestroy.push(containerId);
      }
    }

    for (const containerId of toDestroy) {
      await this.destroyContainer(containerId);
    }

    if (toDestroy.length > 0) {
      console.log(`[PlayCanvasContainer] Cleaned up ${toDestroy.length} inactive instances`);
    }
  }

  getInstanceCount(): number {
    return this.instances.size;
  }

  getActiveInstances(): WebContainerInstance[] {
    return Array.from(this.instances.values()).filter(instance => instance.isActive);
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