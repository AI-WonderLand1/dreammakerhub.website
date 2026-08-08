// Plugin system for the custom engine
export interface PluginOptions {
  /** Unique identifier for the plugin */
  id: string;
  /** Version of the plugin */
  version?: string;
  /** Whether the plugin is enabled by default */
  enabled?: boolean;
}

export interface PluginContext {
  /** Reference to the engine instance */
  engine: CustomEngine;
  /** Plugin configuration */
  config: Record<string, any>;
  /** Event emitter for communication */
  events: PluginEventEmitter;
}

export interface PluginEventEmitter {
  /** Subscribe to an event */
  on(event: string, callback: (...args: any[]) => void): () => void;
  /** Emit an event */
  emit(event: string, ...args: any[]): void;
  /** Remove all listeners for an event */
  off(event: string): void;
}

export interface Plugin<O extends PluginOptions = PluginOptions> {
  /** Initialize the plugin */
  initialize?(context: PluginContext, options: O): Promise<void> | void;
  /** Clean up the plugin */
  dispose?(): Promise<void> | void;
  /** Called when plugin is enabled */
  onEnable?(): Promise<void> | void;
  /** Called when plugin is disabled */
  onDisable?(): Promise<void> | void;
  /** Get plugin metadata */
  getMetadata(): PluginMetadata;
}

export interface PluginMetadata {
  /** Plugin ID */
  id: string;
  /** Plugin name */
  name: string;
  /** Plugin description */
  description: string;
  /** Plugin version */
  version: string;
  /** Author */
  author?: string;
  /** Plugin dependencies */
  dependencies?: string[];
}