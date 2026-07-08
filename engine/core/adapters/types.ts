import type { EngineConfig, EngineInstance } from '../runtime/types';

export type { EngineConfig, EngineInstance }

export interface EngineAdapter {
  name: string;
  create(config: EngineConfig): Promise<EngineInstance>;
}

export interface WebGLShader {
  vertex: string;
  fragment: string;
}

export interface ExternalEngineExporter {
  engineName: string;
  exportScene(scene: UniversalScene, options?: ExportOptions): Promise<ExportResult>;
}

export interface ExportOptions {
  includeTextures?: boolean;
  includeAnimations?: boolean;
  format?: 'glb' | 'gltf' | 'fbx';
  outputPath?: string;
}

export interface ExportResult {
  success: boolean;
  files: ExportFile[];
  downloadUrl?: string;
  error?: string;
}

export interface ExportFile {
  name: string;
  path: string;
  data: ArrayBuffer | string;
  mimeType: string;
}

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
}
