import { EngineConfig, EngineAdapter, ActiveEngine, EngineName } from './types';

export class EngineManager {
  private active: ActiveEngine | null = null;
  private initializing: string | null = null;
  private adapters = new Map<string, EngineAdapter>();

  /**
   * Registers an engine adapter.
   */
  public registerAdapter(adapter: EngineAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /**
   * Loads a new engine, ensuring the previous one is fully disposed.
   */
  public async loadEngine(name: string, config: EngineConfig): Promise<void> {
    if (this.initializing) {
      throw new Error(`Engine "${this.initializing}" is still initializing. Please wait.`);
    }

    if (this.active?.name === name) {
      return; // Already running
    }

    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`No adapter registered for engine: ${name}`);
    }

    // 1. Dispose current engine if active
    if (this.active) {
      await this.dispose();
    }

    // 2. Block parallel initialization
    this.initializing = name;

    try {
      // 3. Create new engine via adapter
      const instance = await adapter.create(config);

      // 4. Set as active
      this.active = {
        name,
        canvas: instance.canvas,
        context: instance.context,
        device: instance.device,
        rafId: null,
        destroy: instance.destroy,
      };

      // 5. Start the single RAF loop
      this.startLoop();

      console.log(`[EngineManager] Successfully loaded engine: ${name}`);
    } catch (error) {
      console.error(`[EngineManager] Failed to load engine ${name}:`, error);
      throw error;
    } finally {
      this.initializing = null;
    }
  }

  /**
   * Disposes the currently active engine.
   */
  public async dispose(): Promise<void> {
    if (!this.active) return;

    console.log(`[EngineManager] Disposing active engine: ${this.active.name}`);

    // 1. Stop the RAF loop
    if (this.active.rafId !== null) {
      cancelAnimationFrame(this.active.rafId);
      this.active.rafId = null;
    }

    // 2. Destroy engine resources via adapter
    try {
      await this.active.destroy();
    } catch (err) {
      console.error(`[EngineManager] Error during engine destruction:`, err);
    }

    // 3. Clear canvas context (attempt to release GPU memory)
    if (this.active.context) {
      const webglLost = this.active.context.getExtension('WEBGL_lose_context');
      if (webglLost) {
        webglLost.loseContext();
      }
    }

    // 4. Release WebGPU device if present
    if (this.active.device) {
      this.active.device.destroy();
    }

    // 5. Reset state
    this.active = null;
  }

  /**
   * Starts the single global RAF loop.
   */
  private startLoop(): void {
    if (!this.active) return;

    const loop = (time: number) => {
      if (!this.active) return;

      // Callback to the active engine for frame updates
      if (typeof this.active.onFrame === 'function') {
        this.active.onFrame(time);
      }

      this.active!.rafId = requestAnimationFrame(loop);
    };

    this.active.rafId = requestAnimationFrame(loop);
  }

  public getActiveEngineName(): string | null {
    return this.active?.name ?? null;
  }

  public isInitializing(): boolean {
    return this.initializing !== null;
  }
}

export const engineManager = new EngineManager();
