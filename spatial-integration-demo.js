// Example: Integrating Custom Engine with Spatial Platform
// This demonstrates how the custom engine can work with the existing spatial-platform packages

import { CustomEngine } from './custom-engine/dist/index.js';
import { NPCSimulationAIPlugin } from './custom-engine/dist/index.js';
import { SpatialNPC } from '@spatial/ai-npc'; // From spatial-platform
import { engineCore } from '@spatial/engine-core'; // From spatial-platform

// Note: In a real implementation, you would need to properly set up the spatial-platform dependencies
// This example shows the conceptual integration

async function runSpatialIntegrationDemo() {
  console.log('Spatial Platform + Custom Engine Integration Demo');
  console.log('=================================================');
  
  try {
    // 1. Create the custom engine (handles rendering and main loop)
    const customEngine = new CustomEngine({
      width: 1024,
      height: 768,
      backgroundColor: [0.05, 0.05, 0.1, 1.0],
      debug: true
    });
    
    await customEngine.initialize();
    
    // 2. Create NPC-Sim AI plugin (provides AI brains for NPCs)
    const npcSimPlugin = new NPCSimulationAIPlugin({
      apiUrl: 'http://localhost:3000/api/sim', // Connect to your npc-sim instance
      tickInterval: 100,
      autoTick: true,
      initialNPCs: [
        { id: 'alice', name: 'Alice', position: [0, 1.5, 0] },
        { id: 'bob', name: 'Bob', position: [2, 1.5, 0] },
        { id: 'charlie', name: 'Charlie', position: [-2, 1.5, 0] }
      ]
    });
    
    await customEngine.addPlugin(npcSimPlugin);
    
    // 3. Set up Spatial NPCs (from spatial-platform) that will be controlled by the custom engine
    // In a real implementation, you would synchronize these with the custom engine's visual components
    
    const spatialNPCs = new Map();
    
    // Create Spatial NPC instances
    const aliceSpatial = new SpatialNPC({
      id: 'alice',
      name: 'Alice',
      worldId: 'world-1',
      modelUrl: '/models/alice.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      personality: 'Friendly and curious explorer',
      llmProvider: 'anthropic',
      llmModel: 'claude-3-sonnet-20240229',
      systemPrompt: 'You are Alice, a friendly explorer in a virtual world.',
      knowledgeBase: ['World geography', 'Local customs', 'Survival skills'],
      memorySize: 100,
      interactionRadius: 5.0,
      voiceEnabled: true
    });
    
    const bobSpatial = new SpatialNPC({
      id: 'bob',
      name: 'Bob',
      worldId: 'world-1',
      modelUrl: '/models/bob.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      personality: 'Hardworking craftsman',
      llmProvider: 'openai',
      llmModel: 'gpt-4',
      systemPrompt: 'You are Bob, a skilled craftsman who enjoys building and creating things.',
      knowledgeBase: ['Woodworking', 'Metalworking', 'Engineering principles'],
      memorySize: 100,
      interactionRadius: 4.0,
      voiceEnabled: true
    });
    
    spatialNPCs.set('alice', aliceSpatial);
    spatialNPCs.set('bob', bobSpatial);
    
    // 4. Set up API keys for the spatial NPCs (in a real app, these would come from secure storage)
    // aliceSpatial.setApiKey('your-anthropic-api-key');
    // bobSpatial.setApiKey('your-openai-api-key');
    
    // 5. Synchronize between custom engine and spatial-platform
    // In a real implementation, you would:
    //   - Use the custom engine's visual components to represent the spatial NPCs
    //   - Update spatial NPC states based on custom engine simulation
    //   - Send commands from spatial NPCs to the custom engine to affect the visual world
    
    // Example synchronization loop (simplified)
    customEngine.on('after-render', (deltaTime) => {
      // Update spatial NPCs based on engine state
      // In reality, you'd get position/rotation from visual components
      // and update the spatial NPCs accordingly
      
      // For demo purposes, we'll just update their internal timers
      const now = Date.now();
      for (const [id, npc] of spatialNPCs.entries()) {
        // In a real implementation, you would have actual position/rotation data
        // npc.updatePosition([Math.sin(now/1000) * 2, 0, Math.cos(now/1000) * 2]);
        // npc.updateRotation([0, Math.sin(now/1000), 0]);
      }
    });
    
    // 6. Handle events from spatial NPCs and feed them to the custom engine
    // For example, when a spatial NPC decides to speak, trigger visual dialogue
    
    // 7. Start the engine
    await customEngine.start();
    
    console.log('Integration demo running...');
    console.log('In a real implementation:');
    console.log('  - Custom Engine handles rendering and main loop');
    console.log('  - NPC-Sim AI Plugin provides simulation and decision making');
    console.log('  - Spatial Platform NPCs provide high-level AI behavior and dialogue');
    console.log('  - All systems are synchronized through events and shared state');
    
    // Run for 10 seconds then clean up
    setTimeout(async () => {
      console.log('\nStopping integration demo...');
      
      // Clean up spatial NPCs
      for (const npc of spatialNPCs.values()) {
        npc.destroy();
      }
      
      // Stop and destroy custom engine
      await customEngine.stop();
      await customEngine.destroy();
      
      console.log('Integration demo stopped.');
    }, 10000);
    
  } catch (error) {
    console.error('Error in integration demo:', error);
    // Try to clean up
    try {
      await customEngine.stop();
      await customEngine.destroy();
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSpatialIntegrationDemo().catch(console.error);
}

export { runSpatialIntegrationDemo };