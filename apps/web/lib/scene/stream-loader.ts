import { logger } from '@/lib/logger';
export interface StreamSceneOptions {
  onMetadata?: (metadata: any) => void;
  onEntity?: (entity: any, index: number, total: number) => void;
  onEnvironment?: (environment: any) => void;
  onLight?: (light: any, index: number, total: number) => void;
  onProgress?: (progress: number) => void;
  onComplete?: (scene: any) => void;
  onError?: (error: string) => void;
}

export class SceneStreamLoader {
  private scene: any = {
    entities: [],
    environment: {},
    lights: []
  };
  private metadata: any = {};
  private entityCount = 0;
  private lightCount = 0;
  private loadedEntities = 0;
  private loadedLights = 0;

  constructor(private options: StreamSceneOptions = {}) {}

  async loadScene(sceneId: string): Promise<void> {
    try {
      const response = await fetch(`/api/scenes/${sceneId}/stream`);
      
      if (!response.ok) {
        throw new Error(`Failed to load scene: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          await this.processLine(line);
        }
      }
      
      // Final scene assembly
      const completeScene = {
        ...this.metadata,
        ...this.scene
      };
      
      this.options.onComplete?.(completeScene);
      
    } catch (error) {
      logger.error("Scene streaming error:", error);
      this.options.onError?.(error instanceof Error ? error.message : "Unknown error");
    }
  }

  private async processLine(line: string): Promise<void> {
    try {
      const data = JSON.parse(line);
      
      switch (data.type) {
        case "metadata":
          this.metadata = data.data;
          this.options.onMetadata?.(data.data);
          break;
          
        case "entities_start":
          this.entityCount = data.count;
          this.scene.entities = [];
          break;
          
        case "entity": {
          this.scene.entities[data.index] = data.data;
          this.loadedEntities++;
          
          // Calculate progress
          const totalItems = this.entityCount + this.lightCount;
          const loadedItems = this.loadedEntities + this.loadedLights;
          const progress = totalItems > 0 ? (loadedItems / totalItems) * 100 : 0;
          
          this.options.onProgress?.(progress);
          this.options.onEntity?.(data.data, data.index, this.entityCount);
          break;
        }
          
        case "entities_end":
          // Entities loading complete
          break;
          
        case "environment":
          this.scene.environment = data.data;
          this.options.onEnvironment?.(data.data);
          break;
          
        case "lights_start":
          this.lightCount = data.count;
          this.scene.lights = [];
          break;
          
        case "light": {
          this.scene.lights[data.index] = data.data;
          this.loadedLights++;
          
          // Calculate progress
          const totalItems2 = this.entityCount + this.lightCount;
          const loadedItems2 = this.loadedEntities + this.loadedLights;
          const progress2 = totalItems2 > 0 ? (loadedItems2 / totalItems2) * 100 : 0;
          
          this.options.onProgress?.(progress2);
          this.options.onLight?.(data.data, data.index, this.lightCount);
          break;
        }
          
        case "lights_end":
          // Lights loading complete
          break;
          
        case "complete":
          // Streaming complete
          break;
          
        default:
          logger.warn("Unknown stream type:", data.type);
      }
      
    } catch (error) {
      logger.error("Error processing stream line:", error);
    }
  }

  // Static method for easy usage
  static async streamScene(sceneId: string, options: StreamSceneOptions = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const loader = new SceneStreamLoader({
        ...options,
        onComplete: (scene) => {
          options.onComplete?.(scene);
          resolve(scene);
        },
        onError: (error) => {
          options.onError?.(error);
          reject(new Error(error));
        }
      });
      
      loader.loadScene(sceneId);
    });
  }
}