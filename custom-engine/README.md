# Custom NPC Engine

A custom engine for creating AI-driven NPCs with visual components, plugin system, and integration capabilities.

## Features

- **Customizable Engine Core**: Lightweight rendering engine with main loop and scene management
- **Plugin System**: Extend functionality with AI, tools, and visual plugins
- **Visual Component System**: Base classes for creating visual representations of NPCs and objects
- **AI Integration**: Built-in plugins for connecting to npc-sim simulation and external AI services
- **Tools Plugins**: Transform tools, animation tools, and basic physics tools
- **Event-Driven Architecture**: Loose coupling between components through event system

## Installation

```bash
npm install custom-npc-engine
```

## Usage

### Basic Engine Setup

```typescript
import { CustomEngine } from 'custom-npc-engine';

// Create engine instance
const engine = new CustomEngine({
  width: 800,
  height: 600,
  backgroundColor: [0.1, 0.1, 0.2, 1.0],
  debug: true
});

// Initialize and start
await engine.initialize();
engine.start();

// Remember to destroy when done
// engine.destroy();
```

### Adding NPC-Sim AI Plugin

```typescript
import { NPCSimulationAIPlugin } from 'custom-npc-engine';

const npcSimPlugin = new NPCSimulationAIPlugin({
  apiUrl: 'http://localhost:3000/api/sim',
  tickInterval: 100,
  autoTick: true,
  initialNPCs: [
    { id: 'alice', name: 'Alice', position: [0, 0, 0] },
    { id: 'bob', name: 'Bob', position: [3, 0, 0] }
  ]
});

await engine.addPlugin(npcSimPlugin);
```

### Adding Transform Tools

```typescript
import { TransformToolsPlugin } from 'custom-npc-engine';

const transformTools = new TransformToolsPlugin({
  showGizmos: true,
  gizmoSize: 1.0,
  snapTranslation: 0.5,
  snapRotation: 15
});

await engine.addPlugin(transformTools);
```

### Creating Visual Components

```typescript
import { VisualComponent } from 'custom-npc-engine';

class MyNPCVisual extends VisualComponent {
  // Implement your custom NPC visual logic
  update(deltaTime: number) {
    // Update logic here
  }
  
  render() {
    // Rendering logic here
  }
}

// Add to engine through a visual plugin
// (Visual plugins typically handle creating and managing visual components)
```

## Plugin System

The engine uses a plugin system to extend functionality. Plugins can:

- Access the engine instance
- Listen to and emit events
- Manage visual components
- Implement custom logic in the engine lifecycle

See the source code for detailed plugin interfaces.

## AI Integration

### NPC-Sim Simulation Plugin

Connects to your existing npc-sim simulation to drive NPC behavior:

```typescript
const npcSimPlugin = new NPCSimulationAIPlugin({
  apiUrl: 'http://localhost:3000/api/sim', // Your npc-sim API endpoint
  tickInterval: 50, // 20 ticks per second
  autoTick: true,
  initialNPCs: [
    { id: 'player', name: 'Player', position: [0, 0, 0] },
    { id: 'npc1', name: 'Friendly NPC', position: [5, 0, 0] }
  ]
});
```

The plugin will:
- Automatically tick the simulation at the specified interval
- Process NPC decisions and update visual components accordingly
- Handle simulation events (dialogue, social interactions, work, etc.)
- Provide methods to manually tick the simulation or subscribe to events

### External AI Plugin

Connect to external AI services like OpenAI or Anthropic:

```typescript
import { ExternalAIPlugin } from 'custom-npc-engine';

const externalAI = new ExternalAIPlugin({
  provider: 'openai',
  model: 'gpt-4',
  systemPrompt: 'You are an NPC in a fantasy world.',
  temperature: 0.8
});

// Set your API key
externalAI.setApiKey('your-api-key-here');

// Use in your own systems or plugins
const dialogue = await externalAI.generateDialogue('guard', 
  'The player has approached the castle gates requesting entry.');
```

## Tools Plugins

### Transform Tools

Provides move, rotate, and scale gizmos for manipulating objects:

```typescript
import { TransformToolsPlugin } from 'custom-npc-engine';

const transformTools = new TransformToolsPlugin({
  showGizmos: true,
  gizmoSize: 1.2,
  snapTranslation: 0.25,
  snapRotation: 10,
  snapScale: 0.05
});

await engine.addPlugin(transformTools);

// Control via API:
// transformTools.setMode('move');
// transformTools.startTransform(objectId, 'move', mouseX, mouseY);
// transformTools.updateTransform(mouseX, mouseY);
// transformTools.endTransform();
```

### Animation Tools

Create and play animations on objects:

```typescript
import { AnimationToolsPlugin } from 'custom-npc-engine';

const animationTools = new AnimationToolsPlugin();
await engine.addPlugin(animationTools);

// Define an animation
animationTools.defineAnimation({
  name: 'wave',
  duration: 1.0,
  loop: false,
  tracks: [
    {
      targetProperty: 'rotation',
      keyframes: [
        { time: 0.0, value: [0, 0, 0] },
        { time: 0.25, value: [0, 0.5, 0] },
        { time: 0.5, value: [0, 0, 0] },
        { time: 0.75, value: [0, -0.5, 0] },
        { time: 1.0, value: [0, 0, 0] }
      ]
    }
  ]
});

// Play the animation
const instanceId = animationTools.playAnimation({
  objectId: 'npc-visual',
  animationName: 'wave'
});
```

### Physics Tools

Basic physics simulation:

```typescript
import { PhysicsToolsPlugin } from 'custom-npc-engine';

const physics = new PhysicsToolsPlugin();
await engine.addPlugin(physics);

// Register objects for physics
physics.registerPhysicsObject({
  objectId: 'ball-visual',
  mass: 1.0,
  restitution: 0.8,
  friction: 0.2
});

// Apply forces
physics.applyForce('ball-visual', [0, 10, 0]); // Upward force

// Start simulation
physics.startSimulation();
```

## Event System

The engine uses an event system for loose coupling:

```typescript
// Listen for events
const unsubscribe = engine.on('object-add', (object) => {
  console.log(`Object added: ${object.id}`);
});

// Stop listening
unsubscribe();
```

## Building from Source

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch for changes during development
npm run build:dev
```

## License

Prosperity Public License 3.0.0. See the repository root [`LICENSE`](../LICENSE).