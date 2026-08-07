// AI plugins for connecting to npc-sim and other AI systems
import { Plugin, PluginContext } from './plugin';
import { NPCVisualComponent } from './visual';

/** Configuration for NPC-Sim plugin */
export interface NPCAISimulationOptions extends PluginOptions {
  /** URL of the npc-sim API */
  apiUrl: string;
  /** How often to tick the simulation (in milliseconds) */
  tickInterval?: number;
  /** Whether to automatically tick the simulation */
  autoTick?: boolean;
  /** Initial NPCs to create */
  initialNPCs?: Array<{
    id: string;
    name: string;
    /** Optional: position in the scene */
    position?: [number, number, number];
  }>;
}

/** Context for NPC-Sim AI plugin */
export interface NPCSimPluginContext extends PluginContext {
  /** Methods to interact with visual components */
  visual: {
    /** Create an NPC visual component */
    createNPCVisual: (options: { id: string; name: string; npcId: string }) => NPCVisualComponent;
    /** Get an NPC visual component by NPC ID */
    getNPCVisualById: (npcId: string) => NPCVisualComponent | undefined;
  };
  /** Methods to control the simulation */
  simulation: {
    /** Manually tick the simulation */
    tick: () => Promise<void>;
    /** Get current simulation state */
    getState: () => Promise<SimulationState>;
    /** Subscribe to simulation events */
    onEvent: (callback: (event: SimulationEvent) => void) => () => void;
  };
}

/** Represents a simulation tick result */
export interface SimulationTickResult {
  /** Current tick number */
  tick: number;
  /** Whether the tick was skipped (paused) */
  skipped: boolean;
  /** Decisions made by NPCs */
  decisions: Array<{
    npcId: string;
    action: string;
    targetNpcId?: string;
    dialogue?: string;
  }>;
  /** Events generated during this tick */
  events: Array<{
    tick: number;
    type: string;
    actorId?: string;
    targetId?: string;
    description: string;
  }>;
}

/** Represents the current state of the simulation */
export interface SimulationState {
  /** Current tick number */
  currentTick: number;
  /** Whether the simulation is paused */
  isPaused: boolean;
  /** World year */
  worldYear: number;
  /** List of NPCs */
  npcs: Array<{
    id: string;
    name: string;
    hunger: number;
    social: number;
    stress: number;
    traits: { aggression: number; sociability: number; ambition: number };
    tribeId: string | null;
    beliefId: string | null;
    status: 'alive' | 'dead';
    age: number;
    createdAtTick: number;
  }>;
  /** List of active relationships */
  relationships: Array<{
    id: string;
    npcIdA: string;
    npcIdB: string;
    score: number;
    type: string;
    lastInteractionTick: number;
  }>;
  /** List of tribes */
  tribes: Array<{
    id: string;
    name: string;
    techLevel: number;
    militaryStrength: number;
    founderId: string | null;
    foundedAtTick: number;
  }>;
  /** List of religions */
  religions: Array<{
    id: string;
    name: string;
    doctrine: string | null;
    foundedAtTick: number;
  }>;
}

/** Represents a simulation event */
export interface SimulationEvent {
  /** Tick when event occurred */
  tick: number;
  /** Type of event */
  type: string;
  /** Actor ID (if applicable) */
  actorId?: string;
  /** Target ID (if applicable) */
  targetId?: string;
  /** Description of the event */
  description: string;
}

/** Plugin for connecting to npc-sim simulation */
export class NPCSimulationAIPlugin implements Plugin {
  private apiUrl: string;
  private tickInterval: number = 1000; // 1 second default
  private autoTick: boolean = true;
  private initialNPCs: Array<{ id: string; name: string; position?: [number, number, number] }> = [];
  private tickTimer: number | null = null;
  private isTicking: boolean = false;
  private eventListeners: Array<(event: SimulationEvent) => void> = [];
  
  // References set during initialization
  private engine: CustomEngine | null = null;
  private visualMethods: {
    createNPCVisual: (options: { id: string; name: string; npcId: string }) => NPCVisualComponent;
    getNPCVisualById: (npcId: string) => NPCVisualComponent | undefined;
  } | null = null;
  private simulationMethods: {
    tick: () => Promise<void>;
    getState: () => Promise<SimulationState>;
    onEvent: (callback: (event: SimulationEvent) => void) => () => void;
  } | null = null;
  
  constructor(options: NPCAISimulationOptions) {
    this.apiUrl = options.apiUrl;
    this.tickInterval = options.tickInterval ?? 1000;
    this.autoTick = options.autoTick ?? true;
    this.initialNPCs = options.initialNPCs ?? [];
  }
  
  /** Get plugin metadata */
  getMetadata(): PluginMetadata {
    return {
      id: 'npc-sim-ai',
      name: 'NPC Simulation AI',
      description: 'Connects the custom engine to the npc-sim simulation for AI-driven NPC behavior',
      version: '1.0.0',
      author: 'Custom Engine Team',
      dependencies: []
    };
  }
  
  /** Initialize the plugin */
  async initialize(context: PluginContext, options: NPCAISimulationOptions): Promise<void> {
    // Extract the visual and simulation methods from context
    const ctx = context as NPCSimPluginContext;
    this.visualMethods = ctx.visual;
    this.simulationMethods = ctx.simulation;
    this.engine = ctx.engine;
    
    // Create initial NPCs
    for const npc of this.initialNPCs {
      if (this.visualMethods) {
        const visualNPC = this.visualMethods.createNPCVisual({
          id: `${npc.id}-visual`,
          name: npc.name,
          npcId: npc.id
        });
        
        // Set initial position if provided
        if (npc.position) {
          visualNPC.setPosition(...npc.position);
        }
      }
    }
    
    // Start ticking if enabled
    if (this.autoTick) {
      this.startTicking();
    }
    
    // Set up event listener for simulation events
    if (this.simulationMethods) {
      this.simulationMethods.onEvent((event) => this.handleSimulationEvent(event));
    }
  }
  
  /** Start the simulation ticking loop */
  private startTicking(): void {
    if (this.tickTimer !== null || !this.autoTick) {
      return;
    }
    
    const tickLoop = async () => {
      if (this.isTicking) {
        // Still ticking from previous frame, skip
        this.tickTimer = setTimeout(tickLoop, this.tickInterval);
        return;
      }
      
      this.isTicking = true;
      try {
        await this.tickSimulation();
      } catch (error) {
        console.error('Error ticking simulation:', error);
      } finally {
        this.isTicking = false;
        this.tickTimer = setTimeout(tickLoop, this.tickInterval);
      }
    };
    
    this.tickTimer = setTimeout(tickLoop, this.tickInterval);
  }
  
  /** Stop the simulation ticking loop */
  private stopTicking(): void {
    if (this.tickTimer !== null) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
  }
  
  /** Manually tick the simulation */
  async tick(): Promise<void> {
    await this.tickSimulation();
  }
  
  /** Perform a single simulation tick */
  private async tickSimulation(): Promise<void> {
    if (!this.simulationMethods) {
      throw new Error('Simulation methods not available');
    }
    
    try {
      const result = await this.simulationMethods.tick();
      
      // Process decisions and update visual components
      if (result.decisions && this.visualMethods) {
        for (const decision of result.decisions) {
          await this.processNPCDecision(decision);
        }
      }
      
      // Process events
      if (result.events) {
        for (const event of result.events) {
          this.handleSimulationEvent(event);
        }
      }
    } catch (error) {
      console.error('Failed to tick simulation:', error);
      throw error;
    }
  }
  
  /** Process a decision made by an NPC */
  private async processNPCDecision(decision: {
    npcId: string;
    action: string;
    targetNpcId?: string;
    dialogue?: string;
  }): Promise<void> {
    if (!this.visualMethods) {
      return;
    }
    
    const visualNPC = this.visualMethods.getNPCVisualById(decision.npcId);
    if (!visualNPC) {
      // Visual component not found, create it if possible
      // In a real implementation, we might want to get NPC details from simulation state
      return;
    }
    
    // Update visual component based on decision
    switch (decision.action) {
      case 'idle':
        visualNPC.setAnimationState('idle');
        break;
      case 'walk':
        visualNPC.setAnimationState('walk');
        // In a real implementation, we'd also set a destination
        break;
      case 'talk':
      case 'socialize':
        visualNPC.setAnimationState('talk');
        if (decision.dialogue) {
          visualNPC.setDialogue(decision.dialogue);
        }
        break;
      case 'work':
        visualNPC.setAnimationState('work');
        break;
      case 'eat':
        visualNPC.setAnimationState('eat');
        break;
      case 'rest':
        visualNPC.setAnimationState('rest');
        break;
      default:
        visualNPC.setAnimationState(decision.action);
        break;
    }
    
    // If there's a target NPC, we could make them look at each other, etc.
    if (decision.targetNpcId && this.visualMethods) {
      const targetVisual = this.visualMethods.getNPCVisualById(decision.targetNpcId);
      // Could implement looking behavior here
    }
  }
  
  /** Handle a simulation event */
  private handleSimulationEvent(event: SimulationEvent): void {
    // Notify all registered listeners
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in simulation event listener:', error);
      }
    }
    
    // Handle specific event types that affect visuals
    switch (event.type) {
      case 'dialogue':
        // Find the actor NPC and set their dialogue
        if (event.actorId && this.visualMethods) {
          const visualNPC = this.visualMethods.getNPCVisualById(event.actorId);
          if (visualNPC) {
            visualNPC.setDialogue(event.description);
          }
        }
        break;
        
      case 'socialize':
        // Make both NPCs perform a social animation
        if (event.actorId && this.visualMethods) {
          const actorVisual = this.visualMethods.getNPCVisualById(event.actorId);
          if (actorVisual) {
            actorVisual.setAnimationState('socialize');
          }
        }
        if (event.targetId && this.visualMethods) {
          const targetVisual = this.visualMethods.getNPCVisualById(event.targetId);
          if (targetVisual) {
            targetVisual.setAnimationState('socialize');
          }
        }
        break;
        
      case 'work':
        if (event.actorId && this.visualMethods) {
          const visualNPC = this.visualMethods.getNPCVisualById(event.actorId);
          if (visualNPC) {
            visualNPC.setAnimationState('work');
          }
        }
        break;
        
      // Add more event handlers as needed
    }
  }
  
  /** Subscribe to simulation events */
  onEvent(callback: (event: SimulationEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index !== -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }
  
  /** Clean up resources */
  async dispose(): Promise<void> {
    this.stopTicking();
    this.eventListeners = [];
    
    // Clear references
    this.engine = null;
    this.visualMethods = null;
    this.simulationMethods = null;
  }
}

/** Plugin for connecting to external AI services (like OpenAI, Anthropic, etc.) */
export class ExternalAIPlugin implements Plugin {
  private apiKey: string = '';
  private provider: 'openai' | 'anthropic' | 'custom' = 'openai';
  private model: string = 'gpt-3.5-turbo';
  private systemPrompt: string = 'You are an NPC in a virtual world.';
  private temperature: number = 0.7;
  private maxTokens: number = 150;
  
  constructor(options: {
    provider?: 'openai' | 'anthropic' | 'custom';
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}) {
    this.provider = options.provider ?? 'openai';
    this.model = options.model ?? (this.provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-sonnet-20240229');
    this.systemPrompt = options.systemPrompt ?? 'You are an NPC in a virtual world.';
    this.temperature = options.temperature ?? 0.7;
    this.maxTokens = options.maxTokens ?? 150;
  }
  
  /** Set the API key */
  setApiKey(key: string): void {
    this.apiKey = key;
  }
  
  /** Get plugin metadata */
  getMetadata(): PluginMetadata {
    return {
      id: 'external-ai',
      name: 'External AI Plugin',
      description: 'Connects to external AI services for NPC dialogue and behavior',
      version: '1.0.0',
      author: 'Custom Engine Team',
      dependencies: []
    };
  }
  
  /** Initialize the plugin */
  async initialize(context: PluginContext, options: Record<string, any>): Promise<void> {
    // Store reference to engine if needed
    // This plugin primarily provides AI generation capabilities
    // that can be used by other plugins or systems
  }
  
  /** Generate text using the external AI service */
  async generateText(prompt: string, context: string[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key not set for ExternalAIPlugin');
    }
    
    // In a real implementation, this would call the actual AI service
    // For now, we'll return a placeholder
    return `AI response to: "${prompt}"`;
  }
  
  /** Generate NPC dialogue based on context */
  async generateDialogue(npcId: string, context: string, nearbyNPCs: string[] = []): Promise<string> {
    const prompt = `You are NPC ${npcId}. Context: ${context}. Nearby NPCs: ${nearbyNPCs.join(', ')}. What do you say?`;
    return this.generateText(prompt, [context]);
  }
  
  /** Clean up resources */
  async dispose(): Promise<void> {
    this.apiKey = '';
  }
}