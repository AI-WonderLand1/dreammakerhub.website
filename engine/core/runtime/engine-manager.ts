import { EngineConfig, ActiveEngine, EngineName } from './types';
import type { EngineAdapter } from '../adapters/types';

export class EngineManager {
  private active: ActiveEngine | null = null;
  private initializing: string | null = null;
  private adapters = new Map<string, EngineAdapter>();
  private supabase: ReturnType<typeof createClient> | null = null;
  private pipelineSubscriptions: Record<string, any> = {};

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
    // Initialize Supabase and pipeline listener on first call
    if (!this.supabase) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
      );
      await this.initializePipelineListener();
    }

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

      // 6. Publish real-time event for pipeline updates
      await this.publishEngineLoadEvent(name, config);

      console.log(`[EngineManager] Successfully loaded engine: ${name}`);
    } catch (error) {
      console.error(`[EngineManager] Failed to load engine ${name}:`, error);
      throw error;
    } finally {
      this.initializing = null;
    }
  }

  /**
   * Initialize Supabase real-time listener for pipeline updates
   */
  private async initializePipelineListener(): Promise<void> {
    if (!this.supabase) return;
    
    try {
      // Subscribe to pipeline execution events
      const channel = this.supabase
        .channel('pipeline-executions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pipeline_executions' },
          (payload) => {
            this.handlePipelineEvent(payload);
          }
        )
        .subscribe();
      
      this.pipelineSubscriptions.engineUpdates = channel;
      console.log('[EngineManager] Initialized pipeline real-time listener');
    } catch (error) {
      console.error('[EngineManager] Failed to initialize pipeline listener:', error);
    }
  }

  /**
   * Handle pipeline execution events
   */
  private handlePipelineEvent(payload: any): void {
    const { event, new: newRecord, old: oldRecord } = payload;
    
    if (event === 'INSERT') {
      this.handlePipelineExecutionInsert(newRecord);
    } else if (event === 'UPDATE') {
      this.handlePipelineExecutionUpdate(newRecord, oldRecord);
    } else if (event === 'DELETE') {
      this.handlePipelineExecutionDelete(newRecord);
    }
  }

  /**
   * Handle new pipeline execution
   */
  private async handlePipelineExecutionInsert(record: any): Promise<void> {
    if (!record.pipeline_id || !this.supabase) return;
    
    try {
      // Get pipeline configuration from storage
      const { data: pipeline } = await this.supabase
        .from('pipeline_templates')
        .select('*')
        .eq('id', record.pipeline_id)
        .single();
      
      if (!pipeline) return;
      
      // Convert pipeline to engine format and execute
      const config = this.convertPipelineToEngineConfig(pipeline, record.inputs, record.trigger);
      
      // Load engine in response to pipeline event
      await this.loadEngine(pipeline.engine_type || 'default', config);
      
      // Update execution status
      await this.supabase
        .from('pipeline_executions')
        .update({ engine_loaded: true, engine_loaded_at: Date.now() })
        .eq('id', record.id);
        
    } catch (error) {
      console.error('[EngineManager] Error handling pipeline execution insert:', error);
    }
  }

  /**
   * Handle pipeline execution update
   */
  private async handlePipelineExecutionUpdate(newRecord: any, oldRecord: any): Promise<void> {
    if (!this.supabase) return;
    
    // Handle real-time pipeline status updates
    if (newRecord.status !== oldRecord.status && newRecord.status === 'completed') {
      // Publish engine completion event
      await this.publishEngineCompletionEvent(newRecord.pipeline_id, newRecord.result);
    }
  }

  /**
   * Handle pipeline execution delete
   */
  private async handlePipelineExecutionDelete(record: any): Promise<void> {
    if (this.active?.name === record.pipeline_id) {
      await this.dispose();
    }
  }

  /**
   * Convert pipeline to engine configuration
   */
  private convertPipelineToEngineConfig(pipeline: any, inputs: any, trigger: any): EngineConfig {
    // This is a placeholder for the actual pipeline-to-engine conversion logic
    // that would be implemented in the pipeline compilation layer
    return {
      name: pipeline.name,
      version: pipeline.version || '1.0.0',
      pipelineId: pipeline.id,
      inputs: inputs,
      trigger: trigger,
      runtimeConfig: pipeline.runtimeConfig || this.getDefaultRuntimeConfig(),
      pipelineSubscriptionId: this.pipelineSubscriptions.engineUpdates?.topic || null,
    };
  }

  /**
   * Get default runtime configuration
   */
  private getDefaultRuntimeConfig(): Record<string, unknown> {
    return {
      engineType: 'pipeline_to_engine',
      supportsRealTimeUpdates: true,
      supportsMultiEngine: false,
      singleEngineRule: true,
      subscriptionLevel: 'basic',
      expressionSupport: true,
      cronTriggerSupport: true,
      memoryPersistence: true,
      eventStreaming: true,
    };
  }

  /**
   * Publish engine load event
   */
  private async publishEngineLoadEvent(engineName: string, config: EngineConfig): Promise<void> {
    if (!this.supabase) return;
    
    try {
      await this.supabase
        .from('engine_events')
        .insert({
          id: crypto.randomUUID(),
          event_type: 'engine_loaded',
          engine_name: engineName,
          engine_config: config,
          timestamp: Date.now(),
          source: 'pipeline_execution',
        });
      
      // Publish to real-time channel
      if (this.supabase) {
        await this.supabase
          .channel(`pipeline:${config.pipelineId}`)
          .send({
            type: 'broadcast',
            event: 'engine:loaded',
            payload: {
              engineName,
              config,
              timestamp: Date.now(),
            }
          });
      }
    } catch (error) {
      console.error('[EngineManager] Failed to publish engine load event:', error);
    }
  }

  /**
   * Publish engine completion event
   */
  private async publishEngineCompletionEvent(pipelineId: string, result: any): Promise<void> {
    if (!this.supabase) return;
    
    try {
      await this.supabase
        .from('engine_events')
        .insert({
          id: crypto.randomUUID(),
          event_type: 'engine_completed',
          pipeline_id: pipelineId,
          result,
          timestamp: Date.now(),
          source: 'pipeline_execution',
        });
    } catch (error) {
      console.error('[EngineManager] Failed to publish engine completion event:', error);
    }
  }

  /**
   * Clean up pipeline subscriptions
   */
  public cleanup(): void {
    Object.values(this.pipelineSubscriptions).forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
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

  /**
   * Initialize Supabase real-time listener for pipeline updates
   */
  private async initializePipelineListener(): Promise<void> {
    try {
      // Subscribe to pipeline execution events
      const channel = this.supabase
        .channel('pipeline-executions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pipeline_executions' },
          (payload) => {
            this.handlePipelineEvent(payload);
          }
        )
        .subscribe();
      
      this.pipelineSubscriptions.engineUpdates = channel;
      console.log('[EngineManager] Initialized pipeline real-time listener');
    } catch (error) {
      console.error('[EngineManager] Failed to initialize pipeline listener:', error);
    }
  }

  /**
   * Handle pipeline execution events
   */
  private handlePipelineEvent(payload: any): void {
    const { event, new: newRecord, old: oldRecord } = payload;
    
    if (event === 'INSERT') {
      this.handlePipelineExecutionInsert(newRecord);
    } else if (event === 'UPDATE') {
      this.handlePipelineExecutionUpdate(newRecord, oldRecord);
    } else if (event === 'DELETE') {
      this.handlePipelineExecutionDelete(newRecord);
    }
  }

  /**
   * Handle new pipeline execution
   */
  private async handlePipelineExecutionInsert(record: any): Promise<void> {
    if (!record.pipeline_id) return;
    
    try {
      // Get pipeline configuration from storage
      const { data: pipeline } = await this.supabase
        .from('pipeline_templates')
        .select('*')
        .eq('id', record.pipeline_id)
        .single();
      
      if (!pipeline) return;
      
      // Convert pipeline to engine format and execute
      const config = this.convertPipelineToEngineConfig(pipeline, record.inputs, record.trigger);
      
      // Load engine in response to pipeline event
      await this.loadEngine(pipeline.engine_type || 'default', config);
      
      // Update execution status
      await this.supabase
        .from('pipeline_executions')
        .update({ engine_loaded: true, engine_loaded_at: Date.now() })
        .eq('id', record.id);
        
    } catch (error) {
      console.error('[EngineManager] Error handling pipeline execution insert:', error);
    }
  }

  /**
   * Handle pipeline execution update
   */
  private async handlePipelineExecutionUpdate(newRecord: any, oldRecord: any): Promise<void> {
    // Handle real-time pipeline status updates
    if (newRecord.status !== oldRecord.status && newRecord.status === 'completed') {
      // Publish engine completion event
      await this.publishEngineCompletionEvent(newRecord.pipeline_id, newRecord.result);
    }
  }

  /**
   * Handle pipeline execution delete
   */
  private async handlePipelineExecutionDelete(record: any): Promise<void> {
    if (this.active?.name === record.pipeline_id) {
      await this.dispose();
    }
  }

  /**
   * Convert pipeline to engine configuration
   */
  private convertPipelineToEngineConfig(pipeline: any, inputs: any, trigger: any): EngineConfig {
    // This is a placeholder for the actual pipeline-to-engine conversion logic
    // that would be implemented in the pipeline compilation layer
    return {
      name: pipeline.name,
      version: pipeline.version || '1.0.0',
      pipelineId: pipeline.id,
      inputs: inputs,
      trigger: trigger,
      runtimeConfig: pipeline.runtimeConfig || this.getDefaultRuntimeConfig(),
      pipelineSubscriptionId: this.pipelineSubscriptions.engineUpdates?.topic || null,
    };
  }

  /**
   * Get default runtime configuration
   */
  private getDefaultRuntimeConfig(): Record<string, unknown> {
    return {
      engineType: 'pipeline_to_engine',
      supportsRealTimeUpdates: true,
      supportsMultiEngine: false,
      singleEngineRule: true,
      subscriptionLevel: 'basic',
      expressionSupport: true,
      cronTriggerSupport: true,
      memoryPersistence: true,
      eventStreaming: true,
    };
  }

  /**
   * Publish engine load event
   */
  private async publishEngineLoadEvent(engineName: string, config: EngineConfig): Promise<void> {
    try {
      await this.supabase
        .from('engine_events')
        .insert({
          id: crypto.randomUUID(),
          event_type: 'engine_loaded',
          engine_name: engineName,
          engine_config: config,
          timestamp: Date.now(),
          source: 'pipeline_execution',
        });
      
      // Publish to real-time channel
      if (this.supabase) {
        await this.supabase
          .channel(`pipeline:${config.pipelineId}`)
          .send({
            type: 'broadcast',
            event: 'engine:loaded',
            payload: {
              engineName,
              config,
              timestamp: Date.now(),
            }
          });
      }
    } catch (error) {
      console.error('[EngineManager] Failed to publish engine load event:', error);
    }
  }

  /**
   * Publish engine completion event
   */
  private async publishEngineCompletionEvent(pipelineId: string, result: any): Promise<void> {
    try {
      await this.supabase
        .from('engine_events')
        .insert({
          id: crypto.randomUUID(),
          event_type: 'engine_completed',
          pipeline_id: pipelineId,
          result,
          timestamp: Date.now(),
          source: 'pipeline_execution',
        });
    } catch (error) {
      console.error('[EngineManager] Failed to publish engine completion event:', error);
    }
  }

  /**
   * Clean up pipeline subscriptions
   */
  public cleanup(): void {
    Object.values(this.pipelineSubscriptions).forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
  }

export const engineManager = new EngineManager();
