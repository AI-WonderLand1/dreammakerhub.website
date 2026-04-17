export interface PlayCanvasScene {
  name: string;
  version: string;
  objects: PlayCanvasObject[];
  lights: PlayCanvasLight[];
  camera: PlayCanvasCamera;
}

export interface PlayCanvasObject {
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'capsule' | 'cone';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material?: PlayCanvasMaterial;
}

export interface PlayCanvasLight {
  type: 'directional' | 'point' | 'spot';
  color: [number, number, number];
  intensity: number;
  position?: [number, number, number];
}

export interface PlayCanvasCamera {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface PlayCanvasMaterial {
  color?: [number, number, number];
  metalness?: number;
  roughness?: number;
  emissive?: [number, number, number];
}

export interface PlayCanvasEditorConfig {
  containerId: string;
  sceneId: string;
  userId: string;
  assets: PlayCanvasAsset[];
  settings: PlayCanvasEditorSettings;
}

export interface PlayCanvasAsset {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'material' | 'script';
  url: string;
  size: number;
  createdAt: number;
}

export interface PlayCanvasEditorSettings {
  theme: 'dark' | 'light';
  gridVisible: boolean;
  statsVisible: boolean;
  shortcuts: Record<string, string>;
}

export interface PlayCanvasSaveRequest {
  sceneId: string;
  sceneData: PlayCanvasScene;
  timestamp: number;
}

export interface PlayCanvasSaveResponse {
  success: boolean;
  timestamp: number;
  version: number;
}

export interface PlayCanvasExportRequest {
  sceneId: string;
  format: 'json' | 'glb' | 'gltf';
  options?: {
    includeTextures: boolean;
    includeAnimations: boolean;
  };
}

export interface PlayCanvasExportResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}