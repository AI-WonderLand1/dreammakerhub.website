import { ExecutionGraph, ExecutionNode, ExecutionResult, ExecutionContext } from './types';

export interface NodeRunner {
  run(node: ExecutionNode, context: ExecutionContext): Promise<Record<string, unknown>>;
}

export class GraphExecutor {
  private runners = new Map<string, NodeRunner>();

  public registerRunner(type: string, runner: NodeRunner): void {
    this.runners.set(type, runner);
  }

  public async execute(graph: ExecutionGraph, context: ExecutionContext): Promise<ExecutionResult> {
    const nodes = graph.getAllNodes();
    const completedNodes = new Set<string>();
    const outputs: Record<string, unknown> = {};

    // Sort nodes by dependencies (topological sort)
    const sortedNodes = this.topologicalSort(nodes);

    for (const node of sortedNodes) {
      // Check dependencies
      if (!node.deps.every(depId => completedNodes.has(depId))) {
        console.warn(`[GraphExecutor] Skipping node ${node.id} because dependencies are not met.`);
        continue;
      }

      node.status = 'running';
      const runner = this.runners.get(node.type);

      if (!runner) {
        node.status = 'error';
        node.error = `No runner registered for type: ${node.type}`;
        return {
            graphId: graph.id,
            success: false,
            outputs,
            error: `No runner for ${node.type}`,
        };
      }

      try {
        // Resolve inputs from dependency outputs
        const resolvedInputs = this.resolveInputs(node, completedNodes, outputs);
        
        const nodeOutputs = await runner.run({ ...node, inputs: resolvedInputs }, context);
        
        // Merge outputs
        Object.assign(outputs, nodeOutputs);
        
        // Update node state
        node.status = 'done';
        node.outputs = nodeOutputs;
        completedNodes.add(node.id);
      } catch (err: any) {
        node.status = 'error';
        node.error = err.message;
        return {
            graphId: graph.id,
            success: false,
            outputs,
            error: err.message,
        };
      }
    }

    return {
      graphId: graph.id,
      success: true,
      outputs,
    };
  }

  private topologicalSort(nodes: ExecutionNode[]): ExecutionNode[] {
    const sorted: ExecutionNode[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (node: ExecutionNode) => {
      if (visiting.has(node.id)) {
        throw new Error(`Cycle detected in graph at node: ${node.id}`);
      }
      if (!visited.has(node.id)) {
        visiting.add(node.id);
        for (const depId of node.deps) {
          const depNode = nodes.find(n => n.id === depId);
          if (depNode) visit(depNode);
        }
        visiting.delete(node.id);
        visited.add(node.id);
        sorted.push(node);
      }
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        visit(node);
      }
    }

    return sorted;
  }

  private resolveInputs(node: ExecutionNode, completedNodes: Set<string>, allOutputs: Record<string, unknown>): Record<string, unknown> {
    // For now, just returns the provided inputs. 
    // Real implementation would map node.inputs[key] from previous node's outputs.
    return node.inputs;
  }
}
