export interface SceneCompiler {
  name: string;
  compile(scene: any): Promise<any>;
}

export interface EngineRuntimeAdapter {
  name: string;
  start(bundle: any): Promise<void>;
  stop(): Promise<void>;
}

export interface EngineBundle {
  engine: string;
  format: string;
  data: any;
  metadata: Record<string, any>;
}

export interface UniversalScene {
  version: number;
  objects: any[];
  // ... other properties
}
