// Simple test for the custom engine
import { CustomEngine } from './custom-engine/dist/index.js';
import { NPCSimulationAIPlugin } from './custom-engine/dist/index.js';
import { TransformToolsPlugin } from './custom-engine/dist/index.js';
import { VisualComponent } from './custom-engine/dist/index.js';

async function runTests() {
  console.log('Running Custom Engine Tests...');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, condition) {
    if (condition) {
      console.log(`��✓ ${name}`);
      passed++;
    } else {
      console.log(`��✗ ${name}`);
      failed++;
    }
  }
  
  try {
    // Test 1: Engine creation
    const engine = new CustomEngine({
      width: 800,
      height: 600,
      backgroundColor: [0.1, 0.1, 0.1, 1.0]
    });
    
    test('Engine creation', engine instanceof CustomEngine);
    
    // Test 2: Engine initialization
    await engine.initialize();
    test('Engine initialization', engine.getStatus().initialized === true);
    
    // Test 3: Adding a plugin
    const npcSimPlugin = new NPCSimulationAIPlugin({
      apiUrl: 'http://localhost:3000/api/sim',
      autoTick: false
    });
    
    await engine.addPlugin(npcSimPlugin);
    test('Adding plugin', engine.getPlugin('npc-sim-ai') !== undefined);
    
    // Test 4: Removing a plugin
    await engine.removePlugin('npc-sim-ai');
    test('Removing plugin', engine.getPlugin('npc-sim-ai') === undefined);
    
    // Test 5: Engine start/stop
    engine.start();
    test('Engine start', engine.getStatus().running === true);
    
    engine.stop();
    test('Engine stop', engine.getStatus().running === false);
    
    // Test 6: Visual component creation
    class TestVisual extends VisualComponent {
      update(deltaTime) { }
      render() { }
    }
    
    const testVisual = new TestVisual('test-1', 'Test Visual');
    test('Visual component creation', testVisual instanceof VisualComponent);
    
    // Test 7: Visual component hierarchy
    const childVisual = new TestVisual('test-2', 'Test Child');
    testVisual.addChild(childVisual);
    
    test('Visual component parenting', testVisual.getChildren().length === 1);
    testVisual.removeChild(childVisual);
    test('Visual component removal', testVisual.getChildren().length === 0);
    
    // Test 8: Transform tools plugin
    const transformTools = new TransformToolsPlugin();
    await engine.addPlugin(transformTools);
    
    test('Transform tools plugin', engine.getPlugin('transform-tools') !== undefined);
    test('Initial transform mode', transformTools.getMode() === null);
    
    transformTools.setMode('move');
    test('Setting transform mode', transformTools.getMode() === 'move');
    
    // Test 9: Engine status
    const status = engine.getStatus();
    test('Engine status object', 
      status !== null && 
      typeof status.initialized === 'boolean' &&
      typeof status.running === 'boolean' &&
      typeof status.width === 'number' &&
      typeof status.height === 'number'
    );
    
    // Test 10: Engine destruction
    await engine.destroy();
    test('Engine destruction', 
      engine.getStatus().initialized === false && 
      engine.getStatus().running === false
    );
    
  } catch (error) {
    console.error('Test failed with error:', error);
    failed++;
  }
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runTests };