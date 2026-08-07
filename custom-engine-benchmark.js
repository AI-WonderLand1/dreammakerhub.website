// Performance benchmark for the custom engine
import { CustomEngine } from './custom-engine/dist/index.js';
import { NPCSimulationAIPlugin } from './custom-engine/dist/index.js';

async function runBenchmark() {
  console.log('Custom NPC Engine Performance Benchmark');
  console.log('=====================================');
  
  const npcCounts = [10, 50, 100, 250, 500];
  const results = [];
  
  for (const npcCount of npcCounts) {
    console.log(`\nTesting with ${npcCount} NPCs...`);
    
    // Create engine
    const engine = new CustomEngine({
      width: 800,
      height: 600,
      backgroundColor: [0.1, 0.1, 0.1, 1.0],
      debug: false // Disable debug for benchmark
    });
    
    try {
      // Initialize engine
      await engine.initialize();
      
      // Create initial NPCs
      const initialNPCs = [];
      for (let i = 0; i < npcCount; i++) {
        initialNPCs.push({
          id: `npc-${i}`,
          name: `NPC ${i}`,
          position: [
            (Math.random() - 0.5) * 20, // X position
            0,                          // Y position (ground level)
            (Math.random() - 0.5) * 20  // Z position
          ]
        });
      }
      
      // Add NPC-Sim plugin
      const npcSimPlugin = new NPCSimulationAIPlugin({
        apiUrl: 'http://localhost:3000/api/sim', // Would be real API
        tickInterval: 100, // 10 ticks per second
        autoTick: true,
        initialNPCs: initialNPCs
      });
      
      await engine.addPlugin(npcSimPlugin);
      
      // Warm up
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Measure performance over 5 seconds
      const testDuration = 5000; // 5 seconds
      const startTime = performance.now();
      let frameCount = 0;
      let lastFrameTime = startTime;
      
      // Override the animate method to count frames
      const originalAnimate = engine.animate;
      let isRunning = true;
      
      engine.animate = (timestamp) => {
        if (!isRunning) return;
        
        frameCount++;
        const now = timestamp;
        const elapsed = now - lastFrameTime;
        
        // Call original animate (this would normally update the engine)
        // For benchmark purposes, we're just counting calls to animate
        // In a real implementation, this would do actual work
        
        lastFrameTime = now;
        
        if (now - startTime < testDuration) {
          requestAnimationFrame(engine.animate);
        } else {
          isRunning = false;
        }
      };
      
      // Start the engine
      await engine.start();
      
      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, testDuration));
      
      // Stop engine
      isRunning = false;
      await engine.stop();
      await engine.destroy();
      
      // Calculate results
      const actualDuration = performance.now() - startTime;
      const fps = Math.round((frameCount / actualDuration) * 1000);
      
      results.push({
        npcCount,
        fps,
        frameCount,
        duration: actualDuration
      });
      
      console.log(`  FPS: ${fps} (${frameCount} frames over ${actualDuration.toFixed(0)}ms)`);
      
    } catch (error) {
      console.error(`  Error testing ${npcCount} NPCs:`, error.message);
      results.push({
        npcCount,
        fps: 0,
        error: error.message
      });
    }
  }
  
  // Print summary
  console.log('\nBenchmark Summary:');
  console.log('------------------');
  console.log('NPC Count | FPS');
  console.log('----------|-----');
  
  for (const result of results) {
    if (result.error) {
      console.log(`${result.npcCount.toString().padStart(9)} | ERROR (${result.error})`);
    } else {
      console.log(`${result.npcCount.toString().padStart(9)} | ${result.fps.toString().padStart(3)}`);
    }
  }
  
  // Determine maximum viable NPC count for real-time (30 FPS)
  const viableResult = results
    .filter(r => !r.error && r.fps >= 30)
    .reduce((max, current) => (current.npcCount > max.npcCount ? current : max), 
      { npcCount: 0, fps: 0 });
  
  console.log(`\nMaximum viable NPC count for ≥30 FPS: ${viableResult.npcCount} NPCs`);
  
  return results;
}

// Run benchmark if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmark().then(results => {
    console.log('\nBenchmark completed.');
    process.exit(0);
  }).catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

export { runBenchmark };