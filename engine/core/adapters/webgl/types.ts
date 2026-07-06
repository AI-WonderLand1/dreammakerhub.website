import type { EngineAdapter, EngineConfig, EngineInstance } from '../types';

export interface WebGLShader {
  vertex: string;
  fragment: string;
}