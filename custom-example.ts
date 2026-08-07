// Example: Using the custom engine with npc-sim simulation
import { CustomEngine } from './src/engine';
import { NPCSimulationAIPlugin } from './src/ai';
import { TransformToolsPlugin } from './src/tools';
import { VisualComponent } from './src/visual';

// Create the engine
const engine = new CustomEngine({
  width: 1024,
  height: 768,
  backgroundColor: [0.1, 0.1, 0.2, 1.0], // Dark blue background
  debug: true
});

// Initialize the engine
await engine.initialize();

// Add NPC-Sim AI plugin
const npcSimPlugin = new NPCSimulationAIPlugin({
  apiUrl: 'http://localhost:3000/api/sim', // URL to your npc-sim API
  tickInterval: 100, // 10 ticks per second
  autoTick: true,
  initialNPCs: [
    { 
      id: 'alice', 
      name: 'Alice',
      position: [0, 0, 0]
    },
    { 
      id: 'bob', 
      name: 'Bob',
      position: [3, 0, 0]
    },
    { 
      id: 'charlie', 
      name: 'Charlie',
      position: [-3, 0, 0]
    }
  ]
});

await engine.addPlugin(npcSimPlugin);

// Add transform tools plugin
const transformTools = new TransformToolsPlugin({
  showGizmos: true,
  gizmoSize: 1.0,
  snapTranslation: 0.5,
  snapRotation: 15, // 15 degree snapping
  snapScale: 0.1
});

await engine.addPlugin(transformTools);

// Set up event handlers for NPC events
engine.on('object-add', (object) => {
  console.log(`Object added: ${object.id} (${object.name})`);
});

engine.on('object-update', (object) => {
  // Log position changes for debugging
  if (engine.debug) {
    console.debug(`Object ${object.id} moved to: [${object.position.join(', ')}]`);
  }
});

// Handle simulation events from the NPC-Sim plugin
const eventUnsubscribe = npcSimPlugin.onEvent((event) => {
  console.log(`Simulation Event [${event.tick}]: ${event.type} - ${event.description}`);
  
  // You could also trigger visual effects here
  // For example, spawn particles for certain event types
});

// Start the engine
engine.start();

// Example: Manually make an NPC talk after 5 seconds
setTimeout(async () => {
  // In a real implementation, you'd send a command to the npc-sim API
  // or use the plugin's methods to influence NPC behavior
  console.log('Making Alice say hello...');
  
  // This is just an example - actual implementation would depend on your API
  // await fetch('http://localhost:3000/api/sim/command', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     npcId: 'alice',
  //     action: 'talk',
  //     dialogue: 'Hello, world!'
  //   })
  // });
}, 5000);

// Example: Select an object and move it after 3 seconds
setTimeout(() => {
  // Select Alice's visual component
  // transformTools.setMode('move');
  // transformTools.startTransform('alice-visual', 'move', 400, 300);
  // transformTools.updateTransform(500, 350);
  // transformTools.endTransform();
  
  console.log('Example transform would happen here');
}, 3000);

// Cleanup function
function cleanup() {
  eventUnsubscribe();
  engine.destroy();
}

// Return cleanup function for use in a module
export { cleanup };