# Custom NPC Engine - Complete Solution for AI NPCs in Games and Movies

## 🚀 Founding Sponsorship Program

DreamMakerHub is opening a **Founding Sponsor Program** to help fund continued development, infrastructure, AI/cloud costs, testing, deployment, and launch preparation.

The sponsorship ecosystem is:

**Dreamer → Creator → Architect → Studio → Enterprise**

Sponsorship levels currently begin at **$25/month**, with monthly, quarterly, and annual options available. Sponsorship is intended as project support and is **not an offer of equity, securities, ownership, royalties, guaranteed profits, or investment returns**.

👉 **[View the full DreamMakerHub Founding Sponsorship Program](SPONSORSHIP.md)**

---

## Overview

This solution provides a complete, extensible engine for creating AI-driven NPCs (Non-Player Characters) suitable for both games and film production. It combines a customizable rendering engine with powerful AI integration capabilities, visual component systems, and a plugin architecture for extending functionality.

## Key Components

### 1. Custom Engine Core (`src/engine.ts`)
- **Main Loop**: Efficient requestAnimationFrame-based engine loop with fixed timestep option
- **Scene Management**: Add, remove, and update scene objects with hierarchical relationships
- **Event System**: Loose-coupling through custom events (init, start, stop, object-add, etc.)
- **Plugin System**: Extensible architecture for adding AI, tools, and visual capabilities
- **WebGL Rendering**: Basic WebGL context setup with clear color and depth testing
- **Status Reporting**: Get engine state including FPS, object count, and plugin information

### 2. Plugin System (`src/plugin.ts`)
- **Standardized Interface**: All plugins follow a consistent initialization and lifecycle pattern
- **Context Provision**: Plugins receive engine reference, configuration, and event emitter
- **Lifecycle Methods**: initialize, dispose, onEnable, onDisable for flexible plugin management
- **Metadata**: Each plugin provides ID, name, description, version, and dependencies

### 3. Visual Components (`src/visual.ts`)
- **Base VisualComponent**: Foundation for all visual objects with transform hierarchy
- **NPCVisualComponent**: Specialized base for NPCs with animation states, dialogue, and emotions
- **Transform Properties**: Position, rotation, scale with local/world space handling
- **Dirty Flag System**: Efficient transform updates that propagate only when needed
- **Engine Integration**: Visual components can reference the engine for shared resources

### 4. AI Integration (`src/ai.ts`)
#### NPC-Sim Simulation AI Plugin
- **Direct Integration**: Connects to your existing npc-sim simulation engine
- **Automatic Ticking**: Handles simulation updates at configurable intervals
- **Decision Processing**: Converts NPC decisions to visual component updates (animation, dialogue)
- **Event Handling**: Translates simulation events (dialogue, socialize, work) to visual feedback
- **Manual Control**: Ability to manually tick the simulation or subscribe to events

#### External AI Plugin
- **Service Agnostic**: Works with OpenAI, Anthropic, or custom AI services
- **Dialogue Generation**: Creates contextual NPC dialogue based on situation and personality
- **Configuration**: Adjustable temperature, max tokens, and system prompts
- **API Key Management**: Secure handling of API keys for external services

### 5. Tools Plugins (`src/tools.ts`)
#### Transform Tools Plugin
- **Gizmo-Based Manipulation**: Move, rotate, and scale tools with visual gizmos
- **Snapping Options**: Configurable translation, rotation, and scale snapping
- **Drag-and-Drop Interface**: Intuitive mouse-based object manipulation
- **Mode Switching**: Easily switch between transform modes

#### Animation Tools Plugin
- **Keyframe Animation System**: Define animations with multiple property tracks
- **Playback Control**: Play, pause, stop, and resume animation instances
- **Looping Support**: Animations can be set to loop or play once
- **Interpolation**: Linear interpolation between keyframes for smooth animation

#### Physics Tools Plugin
- **Basic Newtonian Physics**: Gravity, forces, velocity, and acceleration
- **Object Registration**: Register visual objects for physics simulation
- **Force Application**: Apply forces to objects to influence their movement
- **Friction and Restitution**: Configurable material properties for realistic behavior
- **Simulation Control**: Start/stop physics simulation with configurable timestep

## Architecture Benefits

### Separation of Concerns
- **Simulation Layer**: NPC-Sim handles AI decision-making, relationships, and needs
- **Presentation Layer**: Custom Engine handles rendering, animation, and visual feedback
- **Integration Layer**: Plugins bridge the two systems, translating decisions to visuals
- **Extensibility**: Add new AI systems, tools, or visual effects without modifying core

### Performance Optimizations
- **Efficient Event System**: Minimal garbage collection with careful listener management
- **Dirty Flag System**: Transforms only recalculated when actually changed
- **Plugin Isolation**: Plugins don't interfere with each other unless explicitly designed to
- **Selective Updates**: Only changed objects trigger visual updates

### Flexibility and Extensibility
- **Renderer Agnostic**: Core engine could be adapted to WebGPU, Canvas 2D, or other renderers
- **Plugin-Driven Features**: Add new capabilities without modifying core engine
- **Visual Component Hierarchy**: Build complex objects from simple parts
- **Configuration Driven**: Most aspects configurable through plugin options

## Usage Examples

### Basic Setup
```typescript
import { CustomEngine } from 'custom-engine';
import { NPCSimulationAIPlugin } from 'custom-engine';

const engine = new CustomEngine({ width: 800, height: 600 });
await engine.initialize();

const npcSimPlugin = new NPCSimulationAIPlugin({
  apiUrl: 'http://localhost:3000/api/sim',
  autoTick: true
});

await engine.addPlugin(npcSimPlugin);
await engine.start();
```

### Adding Visual Components
```typescript
import { VisualComponent } from 'custom-engine';

class MyNPCVisual extends VisualComponent {
  constructor(id: string, name: string, npcId: string) {
    super(id, name);
    // NPC-specific initialization
  }
  
  update(deltaTime: number) {
    // Update animation, dialogue, etc.
  }
  
  render() {
    // Render the NPC model, apply animations, etc.
  }
}

// Add through a visual plugin or directly to scene
```

### Using Tools
```typescript
import { TransformToolsPlugin } from 'custom-engine';

const transformTools = new TransformToolsPlugin({
  showGizmos: true,
  gizmoSize: 1.2
});

await engine.addPlugin(transformTools);

// User can now manipulate objects with mouse
// transformTools.setMode('rotate');
// transformTools.startTransform(objectId, 'rotate', mouseX, mouseY);
// ...
```

## Integration with Existing Systems

### With Spatial Platform
The custom engine is designed to work alongside existing systems like the spatial-platform:

1. **Custom Engine**: Handles rendering and low-level object management
2. **NPC-Sim AI Plugin**: Provides simulation and decision-making (replaces or supplements spatial-platform's AI-NPC)
3. **Spatial Platform Systems**: Can still be used for:
   - High-level world management
   - Multiplayer networking
   - Asset management and streaming
   - UI and menu systems
   - Save/load systems

### With Game Engines (Unity, Unreal, etc.)
The custom engine can be used as:
- **AI Brain Server**: Run npc-sim on a server, have game engines query it for NPC decisions
- **Visualization Tool**: Use during development to visualize and tweak NPC behaviors
- **Hybrid Approach**: Critical gameplay logic in game engine, ambient NPCs handled by custom engine

### With Film Production Pipelines
- **Previsualization**: Use custom engine to block out scenes and test NPC behaviors
- **Performance Capture**: Drive NPC animations with simulation data for reference
- **Crowd Simulation**: Populate background scenes with procedurally generated NPC behaviors
- **Interactive Previs**: Allow directors to interact with NPCs in real-time to test scenarios

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Engine**:
   ```bash
   npm run build
   ```

3. **Run the Demo**:
   ```bash
   npm run example
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

5. **Run Benchmark**:
   ```bash
   npm run benchmark
   ```

## API Documentation

### CustomEngine Options
- `canvas`: HTMLCanvasElement (optional, creates one if not provided)
- `width`: number (default: 800)
- `height`: number (default: 600)
- `backgroundColor`: [number, number, number, number] (default: [0.1, 0.1, 0.1, 1.0])
- `debug`: boolean (default: false)
- `targetFPS`: number (default: 60)

### Plugin Interface
All plugins must implement:
- `getMetadata()`: Returns PluginMetadata
- `initialize(context, options)`: Async initialization method
- Optional lifecycle methods: `dispose()`, `onEnable()`, `onDisable()`

### VisualComponent Interface
All visual components must implement:
- `update(deltaTime)`: Update logic per frame
- `render()`: Rendering logic
- Optional lifecycle methods: `dispose()`, `onEngineSet(engine)`

## License

MIT License - feel free to use, modify, and distribute this engine for both commercial and non-commercial projects.

## Acknowledgments

This engine builds upon concepts from:
- The existing npc-sim simulation engine
- The spatial-platform ecosystem
- Standard game engine architecture patterns
- WebGL best practices
- Plugin-based extensibility models

---

**Ready to create intelligent, engaging NPCs for your games and films? Start building today!**