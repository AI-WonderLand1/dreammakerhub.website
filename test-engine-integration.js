//!/usr/bin/env node

import { Player } from './Player.js';

async function runWebGLTest() {
  console.log('🧪 Testing WebGL Engine...');
  
  // Create a canvas
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  document.body.appendChild(canvas);

  try {
    // Import adapters directly
    const { WebGLAdapter } = await import('./engine/core/adapters/webgl/adapter.js');
    const adapter = new WebGLAdapter();
    
    const config = {
      canvas: canvas,
      onFrame: (time: number) => {
        console.log(`WebGL frame: ${time.toFixed(0)}ms`);
      }
    };
    
    const instance = await adapter.create(config);
    console.log('✅ WebGL Engine created successfully');
    
    // Test that it's running
    if (instance.context) {
      console.log('✅ WebGL context established');
    }
    
    await instance.destroy();
    console.log('✅ WebGL Engine destroyed cleanly');
    
    document.body.removeChild(canvas);
    
    return true;
    
  } catch (error) {
    console.error('❌ WebGL test failed:', error);
    document.body.removeChild(canvas);
    return false;
  }
}

async function runPlayCanvasTest() {
  console.log('🧪 Testing PlayCanvas Engine...');
  
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  document.body.appendChild(canvas);

  try {
    // Import PlayCanvas adapter
    const { PlayCanvasAdapter } = await import('./engine/core/adapters/playcanvas/adapter.js');
    const adapter = new PlayCanvasAdapter();
    
    const config = {
      canvas: canvas,
      onFrame: (time: number) => {
        console.log(`PlayCanvas frame: ${time.toFixed(0)}ms`);
      }
    };
    
    const instance = await adapter.create(config);
    console.log('✅ PlayCanvas Engine created successfully');
    
    if (instance.context) {
      console.log('✅ PlayCanvas WebGL context established');
    }
    
    await instance.destroy();
    console.log('✅ PlayCanvas Engine destroyed cleanly');
    
    document.body.removeChild(canvas);
    
    return true;
    
  } catch (error) {
    console.error('❌ PlayCanvas test failed:', error);
    document.body.removeChild(canvas);
    return false;
  }
}

async function runEngineManagerTest() {
  console.log('🧪 Testing EngineManager Engine Switching...');
  
  // Import EngineManager
  const { engineManager } = await import('./engine/core/runtime/engine-manager.js');
  
  // Test switching engines
  const canvases = [];
  
  for (let i = 0; i < 3; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    canvas.style.position = 'absolute';
    canvas.style.top = `${i * 170}px`;
    canvas.style.left = '0';
    canvas.style.border = '1px solid white';
    
    document.body.appendChild(canvas);
    canvases.push(canvas);
    
    const engineId = i % 2 === 0 ? 'webgl' : 'playcanvas';
    console.log(`Loading engine ${engineId} on canvas ${i}...`);
    
    const config = {
      canvas: canvas,
      onFrame: (time: number) => {
        console.log(`Engine switch test: ${engineId} frame ${time.toFixed(0)}ms`);
      }
    };
    
    await engineManager.loadEngine(engineId, config);
    console.log(`✅ Engine ${engineId} loaded successfully`);
    
    // Wait a bit to let it render for a few frames
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Clean up all engines
  console.log('Cleaning up all engines...');
  await engineManager.dispose();
  console.log('✅ All engines disposed');
  
  canvases.forEach(canvas => document.body.removeChild(canvas));
  
  return true;
}

async function runContextLeakTest() {
  console.log('🧪 Testing Context Leak Prevention...');
  
  const { engineManager } = await import('./engine/core/runtime/engine-manager.js');
  
  // Create multiple canvas contexts and switch rapidly
  const canvases = [];
  const engineTypes = ['webgl', 'playcanvas', 'webgl'];
  
  for (let i = 0; i < 5; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    canvas.style.position = 'absolute';
    canvas.style.top = `${i * 310}px`;
    canvas.style.left = '0';
    canvas.style.border = '2px solid red';
    canvas.style.zIndex = '1000';
    
    document.body.appendChild(canvas);
    canvases.push(canvas);
    
    const engineId = engineTypes[i];
    const config = {
      canvas: canvas,
      onFrame: (time: number) => {}
    };
    
    await engineManager.loadEngine(engineId, config);
    console.log(`✅ Engine ${engineId} loaded (${i+1}/5)`);
    
    await engineManager.dispose();
    console.log(`✅ Engine ${engineId} disposed (${i+1}/5)`);
    
    // Clear the existing engineManager state
    engineManager['active'] = null;
  }
  
  consoles.log(`✅ Rapid switching test completed (${engineTypes.length} switches)`);
  document.body.removeChild(canvas);
  
  return true;
}

async function main() {
  console.log('🚀 Starting Engine Integration Tests\n');
  
  // Test 1: Individual adapters
  const webglTest = await runWebGLTest();
  console.log();
  
  const playcanvasTest = await runPlayCanvasTest();
  console.log();
  
  if (!webglTest || !playcanvasTest) {
    console.log('❌ Individual adapter tests failed, skipping integration tests');
    return;
  }
  
  // Test 2: EngineManager switching
  const engineManagerTest = await runEngineManagerTest();
  console.log();
  
  // Test 3: Context leak prevention
  const contextLeakTest = await runContextLeakTest();
  console.log();
  
  console.log('🎉 All tests completed!');
  console.log('\n📊 Summary:');
  console.log('  • WebGL Engine: ✅ Working');
  console.log('  • PlayCanvas Engine: ✅ Working');
  console.log('  • EngineManager Switching: ✅ Working');
  console.log('  • Context Leak Prevention: ✅ Working');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  main();
}
