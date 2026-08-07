/**
 * Complete Demonstration: Custom Engine + NPC-Sim + Plugins
 * This file demonstrates how all the pieces work together
 */

import { CustomEngine } from './custom-engine/dist/index.js';
import { NPCSimulationAIPlugin } from './custom-engine/dist/index.js';
import { TransformToolsPlugin } from './custom-engine/dist/index.js';
import { AnimationToolsPlugin } from './custom-engine/dist/index.js';
import { PhysicsToolsPlugin } from './custom-engine/dist/index.js';
import { ExternalAIPlugin } from './custom-engine/dist/index.js';

// Mock function to simulate fetching from npc-sim API
// In a real application, you would use actual fetch/XMLHttpRequest
async function mockNpcSimApi(endpoint, method = 'GET', data = null) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Mock responses based on endpoint
  if (endpoint.includes('/api/sim/tick') && method === 'GET') {
    return {
      success: true,
      state: {
        currentTick: 1250,
        isPaused: false,
        worldYear: 0,
        npcs: [
          { id: 'alice', name: 'Alice', hunger: 30, social: 70, stress: 25, 
            traits: { aggression: 20, sociability: 80, ambition: 60 }, 
            tribeId: null, beliefId: null, status: 'alive', age: 25, createdAtTick: 0 },
          { id: 'bob', name: 'Bob', hunger: 45, social: 50, stress: 40, 
            traits: { aggression: 60, sociability: 40, ambition: 70 }, 
            tribeId: null, beliefId: null, status: 'alive', age: 30, createdAtTick: 0 },
          { id: 'charlie', name: 'Charlie', hunger: 25, social: 75, stress: 30, 
            traits: { aggression: 10, sociability: 90, ambition: 50 }, 
            tribeId: null, beliefId: null, status: 'alive', age: 22, createdAtTick: 0 }
        ],
        relationships: [],
        tribes: [],
        religions: [],
        events: [
          { id: 'evt-1', tick: 1245, type: 'dialogue', actorId: 'alice', targetId: 'bob', description: "Hello Bob!" },
          { id: 'evt-2', tick: 1246, type: 'socialize', actorId: 'bob', targetId: 'charlie', description: "Bob and Charlie are talking" }
        ]
      }
    };
  }
  
  if (endpoint.includes('/api/sim/tick') && method === 'POST') {
    // Simulate advancing the simulation
    return {
      success: true,
      result: {
        tick: 1251,
        skipped: false,
        decisions: [
          { npcId: 'alice', action: 'socialize', targetNpcId: 'bob', dialogue: "How's your day going?" },
          { npcId: 'bob', action: 'work', targetNpcId: null, dialogue: null },
          { npcId: 'charlie', action: 'rest', targetNpcId: null, dialogue: null }
        ],
        events: [
          { id: 'evt-3', tick: 1251, type: 'dialogue', actorId: 'alice', targetId: 'bob', description: "How's your day going?" },
          { id: 'evt-4', tick: 1251, type: 'work', actorId: 'bob', targetId: null, description: "Bob is working on a project" },
          { id: 'evt-5', tick: 1251, type: 'rest', actorId: 'charlie', targetId: null, description: "Charlie is taking a break" }
        ]
      }
    };
  }
  
  if (endpoint.includes('/api/sim/command') && method === 'POST') {
    return { success: true };
  }
  
  // Default response
  return { success: true, data: null };
}

// Custom NPC-Sim plugin that uses our mock API for demonstration
class DemoNPCSimulationAIPlugin extends NPCSimulationAIPlugin {
  constructor(options) {
    super(options);
    this.mockApi = mockNpcSimApi;
  }
  
  // Override the tick method to use our mock API
  async tickSimulation() {
    try {
      // In a real implementation, this would call the actual API
      // For demo, we'll use our mock function
      const result = await this.mockApi('/api/sim/tick', 'POST');
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      const simResult = result.result;
      
      // Process decisions and update visual components
      if (simResult.decisions && this.visualMethods) {
        for (const decision of simResult.decisions) {
          await this.processNPCDecision(decision);
        }
      }
      
      // Process events
      if (simResult.events) {
        for (const event of simResult.events) {
          this.handleSimulationEvent(event);
        }
      }
      
      return { 
        tick: simResult.tick, 
        skipped: simResult.skipped,
        decisions: simResult.decisions,
        events: simResult.events
      };
    } catch (error) {
      console.error('Failed to tick simulation:', error);
      throw error;
    }
  }
}

// Main demonstration function
async function runDemo() {
  console.log('Starting Custom NPC Engine Demo...');
  
  // Create engine
  const engine = new CustomEngine({
    width: 1024,
    height: 768,
    backgroundColor: [0.05, 0.05, 0.1, 1.0],
    debug: true
  });
  
  try {
    // Initialize engine
    console.log('Initializing engine...');
    await engine.initialize();
    
    // Add NPC-Sim AI plugin (using our demo version with mock API)
    console.log('Adding NPC-Sim AI plugin...');
    const npcSimPlugin = new DemoNPCSimulationAIPlugin({
      apiUrl: 'http://localhost:3000/api/sim', // Would be real API in production
      tickInterval: 100, // 10 ticks per second
      autoTick: true,
      initialNPCs: [
        { id: 'alice', name: 'Alice', position: [0, 1.5, 0] },
        { id: 'bob', name: 'Bob', position: [2, 1.5, 0] },
        { id: 'charlie', name: 'Charlie', position: [-2, 1.5, 0] }
      ]
    });
    
    await engine.addPlugin(npcSimPlugin);
    
    // Add transform tools plugin
    console.log('Adding Transform Tools plugin...');
    const transformTools = new TransformToolsPlugin({
      showGizmos: true,
      gizmoSize: 1.0,
      snapTranslation: 0.5,
      snapRotation: 15,
      snapScale: 0.1
    });
    
    await engine.addPlugin(transformTools);
    
    // Add animation tools plugin
    console.log('Adding Animation Tools plugin...');
    const animationTools = new AnimationToolsPlugin();
    
    // Define some animations
    animationTools.defineAnimation({
      name: 'wave',
      duration: 1.5,
      loop: false,
      tracks: [
        {
          targetProperty: 'rotation',
          keyframes: [
            { time: 0.0, value: [0, 0, 0] },
            { time: 0.25, value: [0, 0.3, 0] },
            { time: 0.5, value: [0, 0, 0] },
            { time: 0.75, value: [0, -0.3, 0] },
            { time: 1.0, value: [0, 0, 0] },
            { time: 1.25, value: [0, 0.2, 0] },
            { time: 1.5, value: [0, 0, 0] }
          ]
        }
      ]
    });
    
    animationTools.defineAnimation({
      name: 'nod',
      duration: 1.0,
      loop: false,
      tracks: [
        {
          targetProperty: 'rotation',
          keyframes: [
            { time: 0.0, value: [0, 0, 0] },
            { time: 0.3, value: [-0.2, 0, 0] },
            { time: 0.6, value: [0.1, 0, 0] },
            { time: 1.0, value: [0, 0, 0] }
          ]
        }
      ]
    });
    
    await engine.addPlugin(animationTools);
    
    // Add physics tools plugin
    console.log('Adding Physics Tools plugin...');
    const physicsTools = new PhysicsToolsPlugin();
    
    // Register physics objects for our NPCs (simplified)
    // In a real implementation, you'd register actual physics bodies
    await engine.addPlugin(physicsTools);
    
    // Add external AI plugin (for generating dialogue)
    console.log('Adding External AI plugin...');
    const externalAI = new ExternalAIPlugin({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      systemPrompt: 'You are an NPC in a virtual world simulation. Be helpful, friendly, and stay in character.',
      temperature: 0.8,
      maxTokens: 100
    });
    
    // In a real app, you would set the API key from environment variables or secure storage
    // externalAI.setApiKey('your-openai-api-key-here');
    
    await engine.addPlugin(externalAI);
    
    // Set up event listeners
    console.log('Setting up event listeners...');
    
    engine.on('init', () => {
      console.log('Engine initialized');
    });
    
    engine.on('start', () => {
      console.log('Engine started');
    });
    
    engine.on('object-add', (object) => {
      console.log(`Object added: ${object.id} (${object.name})`);
    });
    
    // Listen for simulation events from the NPC-Sim plugin
    const eventUnsubscribe = npcSimPlugin.onEvent((event) => {
      // console.log(`Simulation Event: [${event.tick}] ${event.type} - ${event.description}`);
      
      // Handle specific events
      if (event.type === 'dialogue' && event.actorId) {
        // In a real implementation, you might trigger audio playback or lip-sync here
        console.log(`[Dialogue] ${event.actorId}: "${event.description}"`);
      }
    });
    
    // Start the engine
    console.log('Starting engine...');
    await engine.start();
    
    // Demonstrate some functionality after a delay
    setTimeout(async () => {
      console.log('\n--- Demonstrating NPC Interaction ---');
      
      // Make Alice say something using the external AI plugin
      const externalAIPlugin = engine.getPlugin('external-ai');
      if (externalAIPlugin) {
        try {
          const dialogue = await externalAIPlugin.generateDialogue(
            'alice', 
            'Alice has just spotted Bob approaching from across the village square.', 
            ['bob']
          );
          console.log(`Alice says: "${dialogue}"`);
          
          // In a real implementation, you would send this to the npc-sim as a command
          // or use it to drive Alice's visual dialogue state
        } catch (error) {
          console.error('Failed to generate dialogue:', error.message);
        }
      }
      
      // Play an animation on Charlie
      const animationTools = engine.getPlugin('animation-tools');
      if (animationTools) {
        const instanceId = animationTools.playAnimation({
          objectId: 'charlie-visual', // Assuming this is the visual component ID
          animationName: 'wave'
        });
        console.log(`Playing wave animation on Charlie (instance: ${instanceId})`);
      }
      
      // Example of using transform tools (would normally be done via UI)
      console.log('\n--- Transform Tools Example ---');
      console.log('In a real application, you would use the UI to manipulate objects.');
      console.log('Current mode:', transformTools.getMode());
      
    }, 3000);
    
    // Run for 15 seconds then clean up
    setTimeout(() => {
      console.log('\n--- Stopping Demo ---');
      
      // Clean up
      eventUnsubscribe();
      
      // Stop engine
      engine.stop().then(() => {
        engine.destroy();
        console.log('Engine stopped and destroyed');
      });
      
    }, 15000);
    
  } catch (error) {
    console.error('Error in demo:', error);
    // Try to clean up
    try {
      engine.destroy();
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { runDemo };