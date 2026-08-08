// Base classes for visual components
import { CustomEngine } from './engine';
import { Plugin, PluginContext } from './plugin';

/** Base class for all visual components */
export abstract class VisualComponent {
  /** Unique identifier */
  readonly id: string;
  /** Name of the component */
  name: string;
  /** Whether the component is visible */
  visible: boolean = true;
  /** Parent component */
  parent: VisualComponent | null = null;
  /** Child components */
  protected children: VisualComponent[] = [];
  
  /** Local transform */
  protected localPosition: [number, number, number] = [0, 0, 0];
  protected localRotation: [number, number, number] = [0, 0, 0];
  protected localScale: [number, number, number] = [1, 1, 1];
  
  /** World transform (calculated) */
  worldPosition: [number, number, number] = [0, 0, 0];
  worldRotation: [number, number, number] = [0, 0, 0];
  worldScale: [number, number, number] = [1, 1, 1];
  
  /** Whether the transform is dirty and needs recalculation */
  protected transformDirty: boolean = true;
  
  /** Reference to the engine */
  protected engine: CustomEngine | null = null;
  
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  
  /** Set the engine reference */
  setEngine(engine: CustomEngine): void {
    this.engine = engine;
    this.onEngineSet(engine);
    
    // Propagate to children
    for (const child of this.children) {
      child.setEngine(engine);
    }
  }
  
  /** Called when engine is set */
  protected onEngineSet(engine: CustomEngine): void {
    // Override in subclasses
  }
  
  /** Add a child component */
  addChild(component: VisualComponent): void {
    if (component.parent) {
      component.parent.removeChild(component);
    }
    
    this.children.push(component);
    component.parent = this;
    component.setEngine(this.engine!);
    this.markTransformDirty();
  }
  
  /** Remove a child component */
  removeChild(component: VisualComponent): void {
    const index = this.children.indexOf(component);
    if (index === -1) {
      return;
    }
    
    this.children.splice(index, 1);
    component.parent = null;
    component.setEngine(null as any);
    this.markTransformDirty();
  }
  
  /** Get child by ID */
  getChild(id: string): VisualComponent | undefined {
    return this.children.find(child => child.id === id);
  }
  
  /** Get all children */
  getChildren(): VisualComponent[] {
    return [...this.children];
  }
  
  /** Set local position */
  setPosition(x: number, y: number, z: number): void {
    this.localPosition = [x, y, z];
    this.markTransformDirty();
  }
  
  /** Set local rotation (in radians) */
  setRotation(x: number, y: number, z: number): void {
    this.localRotation = [x, y, z];
    this.markTransformDirty();
  }
  
  /** Set local scale */
  setScale(x: number, y: number, z: number): void {
    this.localScale = [x, y, z];
    this.markTransformDirty();
  }
  
  /** Mark transform as dirty */
  protected markTransformDirty(): void {
    if (this.transformDirty) {
      return;
    }
    
    this.transformDirty = true;
    
    // Propagate to children
    for (const child of this.children) {
      child.markTransformDirty();
    }
  }
  
  /** Update world transform */
  updateTransform(parentWorldPos: [number, number, number] = [0, 0, 0], 
                  parentWorldRot: [number, number, number] = [0, 0, 0],
                  parentWorldScale: [number, number, number] = [1, 1, 1]): void {
    if (!this.transformDirty) {
      // Still need to update children if they're dirty
      for (const child of this.children) {
        child.updateTransform(this.worldPosition, this.worldRotation, this.worldScale);
      }
      return;
    }
    
    // Calculate world position
    // Simplified - in a real engine we'd use proper matrix math
    this.worldPosition = [
      parentWorldPos[0] + this.localPosition[0] * parentWorldScale[0],
      parentWorldPos[1] + this.localPosition[1] * parentWorldScale[1],
      parentWorldPos[2] + this.localPosition[2] * parentWorldScale[2]
    ];
    
    // Calculate world rotation (simplified addition)
    this.worldRotation = [
      parentWorldRot[0] + this.localRotation[0],
      parentWorldRot[1] + this.localRotation[1],
      parentWorldRot[2] + this.localRotation[2]
    ];
    
    // Calculate world scale
    this.worldScale = [
      parentWorldScale[0] * this.localScale[0],
      parentWorldScale[1] * this.localScale[1],
      parentWorldScale[2] * this.localScale[2]
    ];
    
    this.transformDirty = false;
    
    // Update children
    for (const child of this.children) {
      child.updateTransform(this.worldPosition, this.worldRotation, this.worldScale);
    }
  }
  
  /** Update component logic */
  abstract update(deltaTime: number): void;
  
  /** Render component */
  abstract render(): void;
  
  /** Clean up resources */
  dispose(): void {
    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }
    
    // Dispose children
    for (const child of [...this.children]) {
      child.dispose();
    }
  }
}

/** Base class for NPC visual components */
export abstract class NPCVisualComponent extends VisualComponent {
  /** NPC ID that this component represents */
  npcId: string;
  /** Current animation state */
  protected animationState: string = 'idle';
  /** Animation progress [0-1] */
  protected animationProgress: number = 0;
  /** Whether the NPC is speaking */
  isSpeaking: boolean = false;
  /** Current dialogue */
  currentDialogue: string | null = null;
  /** Current emotion */
  currentEmotion: string = 'neutral';
  
  constructor(id: string, name: string, npcId: string) {
    super(id, name);
    this.npcId = npcId;
  }
  
  /** Set animation state */
  setAnimationState(state: string): void {
    if (this.animationState === state) {
      return;
    }
    
    this.animationState = state;
    this.animationProgress = 0;
    this.onAnimationStateChange(state);
  }
  
  /** Called when animation state changes */
  protected onAnimationStateChange(state: string): void {
    // Override in subclasses
  }
  
  /** Set dialogue */
  setDialogue(dialogue: string | null): void {
    this.currentDialogue = dialogue;
    this.isSpeaking = dialogue !== null && dialogue.length > 0;
    this.onDialogueChange(dialogue);
  }
  
  /** Called when dialogue changes */
  protected onDialogueChange(dialogue: string | null): void {
    // Override in subclasses
  }
  
  /** Set emotion */
  setEmotion(emotion: string): void {
    if (this.currentEmotion === emotion) {
      return;
    }
    
    this.currentEmotion = emotion;
    this.onEmotionChange(emotion);
  }
  
  /** Called when emotion changes */
  protected onEmotionChange(emotion: string): void {
    // Override in subclasses
  }
}

/** Plugin for adding visual capabilities to the engine */
export interface VisualPluginOptions extends PluginOptions {
  /** Whether to create a default scene */
  createDefaultScene?: boolean;
  /** Background color */
  backgroundColor?: [number, number, number, number];
}

/** Context for visual plugins */
export interface VisualPluginContext extends PluginContext {
  /** Root visual component */
  root: VisualComponent;
  /** Methods to manage visual components */
  visual: {
    /** Add a visual component to the scene */
    addComponent: (component: VisualComponent) => void;
    /** Remove a visual component from the scene */
    removeComponent: (component: VisualComponent) => void;
    /** Get the root component */
    getRoot: () => VisualComponent;
    /** Create an NPC visual component */
    createNPC: (options: { id: string; name: string; npcId: string }) => NPCVisualComponent;
  };
}

/** Base class for visual plugins */
export abstract class VisualPlugin extends Plugin {
  /** Initialize the visual plugin */
  abstract initialize(context: VisualPluginContext, options: VisualPluginOptions): Promise<void> | void;
}