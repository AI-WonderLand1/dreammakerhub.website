import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import type { UserSession, UserIsolation } from '../types/isolation';
import { PlayCanvasContainerManager } from '../webcontainer/PlayCanvasContainer';
import { hashForIsolation } from '../utils/hashing';

export interface PlayCanvasClientConfig {
  userId: string;
  sceneId?: string;
  containerManager?: PlayCanvasContainerManager;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onStatus?: (status: string) => void;
}

export class PlayCanvasClient {
  private containerManager: PlayCanvasContainerManager;
  private userId: string;
  private sceneId?: string;
  private container: WebContainer | null = null;
  private serverUrl: string = '';
  private isInitialized = false;
  private iframe: HTMLIFrameElement | null = null;
  
  private onReady?: () => void;
  private onError?: (error: Error) => void;
  private onStatus?: (status: string) => void;

  constructor(config: PlayCanvasClientConfig) {
    this.userId = config.userId;
    this.sceneId = config.sceneId;
    this.containerManager = config.containerManager || new PlayCanvasContainerManager();
    this.onReady = config.onReady;
    this.onError = config.onError;
    this.onStatus = config.onStatus;
  }

  private updateStatus(status: string): void {
    console.log(`[PlayCanvasClient] ${status}`);
    this.onStatus?.(status);
  }

  private hashUserId(userId: string): string {
    return hashForIsolation(userId);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.updateStatus('Initializing PlayCanvas client...');

    try {
      // Get or create container for user
      const instance = await this.containerManager.getContainer(this.userId);
      this.container = instance.container;
      this.serverUrl = instance.serverUrl;

      if (!this.serverUrl) {
        // Wait for server to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Container server timeout'));
          }, 30000);

          this.container!.on('server-ready', (port, url) => {
            clearTimeout(timeout);
            this.serverUrl = url;
            resolve();
          });
        });
      }

      this.isInitialized = true;
      this.updateStatus('PlayCanvas client initialized');
      this.onReady?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Initialization failed');
      this.onError?.(err);
      throw err;
    }
  }

  async loadScene(sceneId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.sceneId = sceneId;
    this.updateStatus(`Loading scene ${sceneId}...`);

    try {
      // Load scene from container
      const scenePath = `/scenes/${sceneId}.json`;
      const sceneContent = await this.container!.fs.readFile(scenePath, 'utf-8');
      const sceneData = JSON.parse(sceneContent);
      
      // Send scene data to iframe
      if (this.iframe?.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'LOAD_SCENE',
          sceneId,
          sceneData,
        }, '*');
      }

      this.updateStatus(`Scene ${sceneId} loaded`);
    } catch (error) {
      // Scene doesn't exist, create new one
      if (error instanceof Error && error.message.includes('ENOENT')) {
        await this.createNewScene(sceneId);
      } else {
        throw error;
      }
    }
  }

  private async createNewScene(sceneId: string): Promise<void> {
    const defaultScene = {
      name: `Scene ${sceneId}`,
      version: '1.0',
      objects: [],
      lights: [],
      camera: {
        position: [0, 5, 10],
        target: [0, 0, 0],
        fov: 45,
      },
    };

    const scenePath = `/scenes/${sceneId}.json`;
    await this.container!.fs.writeFile(scenePath, JSON.stringify(defaultScene, null, 2));
    
    this.updateStatus(`Created new scene ${sceneId}`);
  }

  async saveScene(sceneId: string, sceneData: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Client not initialized');
    }

    const scenePath = `/scenes/${sceneId}.json`;
    await this.container!.fs.writeFile(scenePath, JSON.stringify(sceneData, null, 2));
    this.updateStatus(`Scene ${sceneId} saved`);
  }

  createEditorContainer(containerElement: HTMLElement): HTMLIFrameElement {
    // Create iframe for PlayCanvas editor
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = 'transparent';
    
    // Set iframe source to container server
    iframe.src = `${this.serverUrl}/playcanvas/editor`;
    
    // Listen for messages from iframe
    window.addEventListener('message', this.handleIframeMessage.bind(this));
    
    containerElement.appendChild(iframe);
    this.iframe = iframe;
    
    return iframe;
  }

  private handleIframeMessage(event: MessageEvent): void {
    if (event.source !== this.iframe?.contentWindow) return;

    const { type, data } = event.data || {};
    
    switch (type) {
      case 'EDITOR_READY':
        this.updateStatus('Editor ready');
        if (this.sceneId) {
          this.loadScene(this.sceneId);
        }
        break;
        
      case 'SCENE_UPDATED':
        if (this.sceneId && data.sceneData) {
          this.saveScene(this.sceneId, data.sceneData);
        }
        break;
        
      case 'ERROR':
        this.onError?.(new Error(data.message || 'Editor error'));
        break;
    }
  }

  async mountFiles(files: FileSystemTree): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.container!.mount(files);
    this.updateStatus('Files mounted');
  }

  async readFile(path: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Client not initialized');
    }

    return await this.container!.fs.readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Client not initialized');
    }

    await this.container!.fs.writeFile(path, content);
  }

  async destroy(): Promise<void> {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    
    window.removeEventListener('message', this.handleIframeMessage.bind(this));
    
    this.isInitialized = false;
    this.updateStatus('PlayCanvas client destroyed');
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  isReady(): boolean {
    return this.isInitialized && !!this.serverUrl;
  }
}

// Factory function for creating PlayCanvas clients
export async function createPlayCanvasClient(
  userId: string,
  sceneId?: string,
  containerManager?: PlayCanvasContainerManager
): Promise<PlayCanvasClient> {
  const client = new PlayCanvasClient({
    userId,
    sceneId,
    containerManager,
    onReady: () => console.log('[PlayCanvas] Client ready'),
    onError: (error) => console.error('[PlayCanvas] Client error:', error),
  });

  await client.initialize();
  return client;
}