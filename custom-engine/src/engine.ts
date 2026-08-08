// Core engine class
import { Plugin, PluginContext, PluginMetadata } from './plugin';

export interface EngineOptions {
  /** Canvas element for rendering */
  canvas?: HTMLCanvasElement;
  /** Width of the rendering area */
  width?: number;
  /** Height of the rendering area */
  height?: number;
  /** Background color */
  backgroundColor?: [number, number, number, number]; // RGBA
  /** Enable debug mode */
  debug?: boolean;
  /** Target FPS */
  targetFPS?: number;
}

export interface SceneObject {
  /** Unique identifier */
  id: string;
  /** Name of the object */
  name: string;
  /** Position [x, y, z] */
  position: [number, number, number];
  /** Rotation [x, y, z] in radians */
  rotation: [number, number, number];
  /** Scale [x, y, z] */
  scale: [number, number, number];
  /** Whether the object is visible */
  visible?: boolean;
  /** Parent object ID */
  parentId?: string;
  /** Child object IDs */
  children?: string[];
  /** Custom data */
  data?: Record<string, any>;
}

export interface CustomEngineEvents {
  /** Engine initialized */
  'init': () => void;
  /** Engine started */
  'start': () => void;
  /** Engine stopped */
  'stop': () => void;
  /** Engine destroyed */
  'destroy': () => void;
  /** Scene object added */
  'object-add': (object: SceneObject) => void;
  /** Scene object removed */
  'object-remove': (objectId: string) => void;
  /** Scene object updated */
  'object-update': (object: SceneObject) => void;
  /** Before render frame */
  'before-render': (deltaTime: number) => void;
  /** After render frame */
  'after-render': (deltaTime: number) => void;
}

export class CustomEngine {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private width: number = 800;
  private height: number = 600;
  private backgroundColor: [number, number, number, number] = [0.1, 0.1, 0.1, 1.0];
  private debug: boolean = false;
  private targetFPS: number = 60;
  private frameDuration: number = 1000 / this.targetFPS;
  
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isInitialized: boolean = false;
  
  private sceneObjects: Map<string, SceneObject> = new Map();
  private plugins: Map<string, Plugin> = new Map();
  private pluginOptions: Map<string, PluginOptions> = new Map();
  
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  
  constructor(options: EngineOptions = {}) {
    this.canvas = options.canvas ?? null;
    this.width = options.width ?? 800;
    this.height = options.height ?? 600;
    this.backgroundColor = options.backgroundColor ?? [0.1, 0.1, 0.1, 1.0];
    this.debug = options.debug ?? false;
    this.targetFPS = options.targetFPS ?? 60;
    this.frameDuration = 1000 / this.targetFPS;
  }
  
  /** Initialize the engine */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Create canvas if not provided
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      document.body.appendChild(this.canvas);
    }
    
    // Get WebGL context
    this.gl = this.canvas.getContext('webgl2') || 
              this.canvas.getContext('webgl') ||
              this.canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      throw new Error('WebGL context not available');
    }
    
    // Set up WebGL
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(
      this.backgroundColor[0],
      this.backgroundColor[1],
      this.backgroundColor[2],
      this.backgroundColor[3]
    );
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    
    this.isInitialized = true;
    this.emit('init');
    
    // Initialize plugins
    await this.initializePlugins();
  }
  
  /** Start the engine */
  start(): void {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }
    
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.emit('start');
    this.animate();
  }
  
  /** Stop the engine */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.emit('stop');
  }
  
  /** Destroy the engine */
  destroy(): void {
    this.stop();
    
    // Dispose plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.dispose) {
        plugin.dispose();
      }
    }
    this.plugins.clear();
    this.pluginOptions.clear();
    
    // Remove event listeners
    this.eventListeners.clear();
    
    // Remove canvas if we created it
    if (this.canvas && this.canvas.parentElement === document.body) {
      this.canvas.remove();
    }
    
    this.gl = null;
    this.canvas = null;
    this.isInitialized = false;
    this.emit('destroy');
  }
  
  /** Main animation loop */
  private animate = (timestamp: number): void => {
    if (!this.isRunning) {
      return;
    }
    
    const deltaTime = (timestamp - this.lastFrameTime) / 1000; // Convert to seconds
    
    // Cap delta time to prevent spiral of death
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    this.lastFrameTime = timestamp;
    
    // Emit before-render event
    this.emit('before-render', cappedDeltaTime);
    
    // Clear buffers
    if (this.gl) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    // Update plugins
    for (const plugin of this.plugins.values()) {
      // Plugins can implement their own update logic if needed
    }
    
    // Render scene (basic implementation - to be extended by visual plugins)
    this.renderScene();
    
    // Emit after-render event
    this.emit('after-render', cappedDeltaTime);
    
    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.animate);
  };
  
  /** Render the scene (basic implementation) */
  private renderScene(): void {
    // This is a basic placeholder - visual plugins should extend this
    // For now, we just clear the screen
    if (!this.gl) return;
    
    // In a real engine, we would iterate through scene objects and render them
    // This would be handled by rendering plugins
  }
  
  /** Add a plugin to the engine */
  async addPlugin<T extends Plugin>(plugin: T, options: T['options'] extends infer O ? O : PluginOptions = {} as PluginOptions): Promise<void> {
    if (this.plugins.has(plugin.getMetadata().id)) {
      throw new Error(`Plugin with ID ${plugin.getMetadata().id} already exists`);
    }
    
    // Store options
    this.pluginOptions.set(plugin.getMetadata().id, options);
    
    // Create plugin context
    const context: PluginContext = {
      engine: this,
      config: options,
      events: {
        on: (event, callback) => {
          this.on(event, callback);
          return () => this.off(event, callback);
        },
        emit: (event, ...args) => this.emit(event, ...args),
        off: (event) => this.off(event)
      }
    };
    
    // Initialize plugin
    if (plugin.initialize) {
      await plugin.initialize(context, options);
    }
    
    // Store plugin
    this.plugins.set(plugin.getMetadata().id, plugin);
    
    // Enable plugin by default if specified
    const pluginOptions = this.pluginOptions.get(plugin.getMetadata().id);
    if (!(pluginOptions.enabled === false)) {
      await this.enablePlugin(plugin.getMetadata().id);
    }
  }
  
  /** Remove a plugin from the engine */
  async removePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    // Disable plugin first
    await this.disablePlugin(pluginId);
    
    // Dispose plugin
    if (plugin.dispose) {
      await plugin.dispose();
    }
    
    // Remove from maps
    this.plugins.delete(pluginId);
    this.pluginOptions.delete(pluginId);
  }
  
  /** Enable a plugin */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    if (plugin.onEnable) {
      await plugin.onEnable();
    }
    
    // Update options to mark as enabled
    const options = this.pluginOptions.get(pluginId);
    if (options) {
      options.enabled = true;
      this.pluginOptions.set(pluginId, options);
    }
  }
  
  /** Disable a plugin */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    if (plugin.onDisable) {
      await plugin.onDisable();
    }
    
    // Update options to mark as disabled
    const options = this.pluginOptions.get(pluginId);
    if (options) {
      options.enabled = false;
      this.pluginOptions.set(pluginId, options);
    }
  }
  
  /** Get a plugin by ID */
  getPlugin<T extends Plugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T;
  }
  
  /** Add a scene object */
  addObject(object: SceneObject): void {
    if (this.sceneObjects.has(object.id)) {
      throw new Error(`Object with ID ${object.id} already exists`);
    }
    
    this.sceneObjects.set(object.id, object);
    this.emit('object-add', object);
  }
  
  /** Remove a scene object */
  removeObject(objectId: string): void {
    const object = this.sceneObjects.get(objectId);
    if (!object) {
      throw new Error(`Object with ID ${objectId} not found`);
    }
    
    this.sceneObjects.delete(objectId);
    this.emit('object-remove', objectId);
  }
  
  /** Update a scene object */
  updateObject(object: SceneObject): void {
    if (!this.sceneObjects.has(object.id)) {
      throw new Error(`Object with ID ${object.id} not found`);
    }
    
    this.sceneObjects.set(object.id, object);
    this.emit('object-update', object);
  }
  
  /** Get a scene object by ID */
  getObject(objectId: string): SceneObject | undefined {
    return this.sceneObjects.get(objectId);
  }
  
  /** Get all scene objects */
  getObjects(): SceneObject[] {
    return Array.from(this.sceneObjects.values());
  }
  
  /** Event handling */
  private on<E extends keyof CustomEngineEvents>(event: E, callback: CustomEngineEvents[E]): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    const listeners = this.eventListeners.get(event)!;
    listeners.add(callback);
    
    return () => this.off(event, callback);
  }
  
  private off<E extends keyof CustomEngineEvents>(event: E, callback: CustomEngineEvents[E]): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) {
      return;
    }
    
    listeners.delete(callback);
    
    // Clean up empty sets
    if (listeners.size === 0) {
      this.eventListeners.delete(event);
    }
  }
  
  private emit<E extends keyof CustomEngineEvents>(event: E, ...args: Parameters<CustomEngineEvents[E]>): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) {
      return;
    }
    
    listeners.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }
    });
  }
  
  /** Get engine status */
  getStatus() {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      width: this.width,
      height: this.height,
      pluginCount: this.plugins.size,
      objectCount: this.sceneObjects.size,
      debug: this.debug
    };
  }
}