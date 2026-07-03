import { ExecutionGraph, ExecutionNode } from './types';

export class ExecutionGraph {
  private graph: ExecutionGraph;

  constructor(id: string, metadata: Record<string, unknown> = {}) {
    this.graph = {
      id,
      nodes: {},
      metadata,
    };
  }

  public addNode(node: ExecutionNode): void {
    this.graph.nodes[node.id] = node;
  }

  public getNode(id: string): ExecutionNode | undefined {
    return this.graph.nodes[id];
  }

  public getAllNodes(): ExecutionNode[] {
    return Object.values(this.graph.nodes);
  }

  public getGraph(): ExecutionGraph {
    return this.graph;
  }

  public validate(): boolean {
    // Basic validation: check if all deps exist
    const nodes = Object.values(this.graph.nodes);
    for (const node of nodes) {
      for (const depId of node.deps) {
        if (!this.graph.nodes[depId]) {
          return false;
        }
      }
    }
    return true;
  }
}
