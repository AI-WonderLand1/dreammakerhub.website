import { ExecutionGraph } from './engine/core/execution/graph';
import { ExecutionNode } from './engine/core/execution/node';
import { GraphExecutor } from './engine/core/execution/executor';

async function test() {
  console.log('Starting Execution Graph Test...');

  const graph = new ExecutionGraph('test-graph');
  
  // Node 1: init
  const node1 = new ExecutionNode({
    id: 'init',
    type: 'scene.init',
    outputs: { sceneId: 'scene-123' }
  });

  // Node 2: build (depends on node 1)
  const node2 = new ExecutionNode({
    id: 'build',
    type: 'build.compile',
    deps: ['init'],
    inputs: { sceneId: 'scene-123' }
  });

  graph.addNode(node1);
  graph.addNode(node2);

  const executor = new GraphExecutor();
  
  // Register a runner for 'scene.init'
  executor.registerRunner('scene.init', {
    run: async (node) => {
      console.log('Running scene.init...');
      return { sceneId: node.inputs.sceneId };
    }
  });

  // Register a runner for 'build.compile'
  executor.registerRunner('build.compile', {
    run: async (node) => {
      console.log('Running build.compile...');
      return { buildStatus: 'success' };
    }
  });

  const result = await executor.execute(graph, { graphId: 'test-graph' });

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.success && result.outputs.buildStatus === 'success') {
    console.log('✅ Test Passed!');
  } else {
    console.error('❌ Test Failed!');
    process.exit(1);
  }
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
