// Main entry point for the custom engine package
// This re-exports everything from the src/index.ts file for convenience

export { CustomEngine } from './src/engine';

// Plugin system
export { 
  Plugin, 
  PluginContext, 
  PluginEventEmitter, 
  PluginMetadata, 
  PluginOptions 
} from './src/plugin';

// Visual components
export { 
  VisualComponent, 
  NPCVisualComponent,
  VisualPlugin,
  VisualPluginContext,
  VisualPluginOptions
} from './src/visual';

// AI plugins
export { 
  NPCSimulationAIPlugin, 
  NPCAISimulationOptions,
  NPCSimPluginContext,
  SimulationTickResult,
  SimulationState,
  SimulationEvent,
  ExternalAIPlugin
} from './src/ai';

// Tools plugins
export { 
  ToolsPlugin,
  TransformToolsPlugin,
  TransformToolsOptions,
  ToolsPluginContext,
  AnimationToolsPlugin,
  PhysicsToolsPlugin
} from './src/tools';

// Engine options and events
export { 
  EngineOptions, 
  SceneObject,
  CustomEngineEvents 
} from './src/engine';

// Version information
export { version } from './package.json' assert { type: 'json' };