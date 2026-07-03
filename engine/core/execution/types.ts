export type NodeType = 
  | 'scene.init' 
  | 'build.compile' 
  | 'engine.render' 
  | 'npc.simulate' 
  | 'asset.stream'
  | 'ai.generate'
  | 'custom';

export type NodeStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

export interface ExecutionNode {
  id: string;
  type: NodeType;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  deps: string[]; // IDs of nodes that must complete before this one starts
  status: NodeStatus;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  error?: string;
}

export interface ExecutionGraph {
  id: string;
  nodes: Record<string, ExecutionNode>;
  metadata: Record<string, unknown>;
}

export interface ExecutionResult {
  graphId: string;
  success: boolean;
  outputs: Record<string, unknown>;
  error?: string;
}

export interface ExecutionContext {
  graphId: string;
  // Can be extended with kernel-level services/adapters
  [key: string]: unknown;
}
