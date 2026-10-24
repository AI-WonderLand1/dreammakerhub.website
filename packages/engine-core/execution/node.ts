import type { ExecutionNode as ExecutionNodeType, NodeType, NodeStatus } from './types';

export class ExecutionNode implements ExecutionNodeType {
  public id: string;
  public type: NodeType;
  public inputs: Record<string, unknown>;
  public outputs: Record<string, unknown>;
  public deps: string[];
  public status: NodeStatus;
  public retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  public error?: string;

  constructor(config: Partial<ExecutionNodeType>) {
    this.id = config.id || crypto.randomUUID();
    this.type = config.type || 'custom';
    this.inputs = config.inputs || {};
    this.outputs = config.outputs || {};
    this.deps = config.deps || [];
    this.status = config.status || 'pending';
    this.retryPolicy = config.retryPolicy;
    this.error = config.error;
  }
}
