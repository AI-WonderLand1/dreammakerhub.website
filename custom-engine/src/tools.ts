// Tools plugins for the custom engine
import { Plugin, PluginContext } from './plugin';
import { VisualComponent, NPCVisualComponent } from './visual';

/** Configuration for transform tools plugin */
export interface TransformToolsOptions extends PluginOptions {
  /** Whether to show gizmos */
  showGizmos?: boolean;
  /** Gizmo size */
  gizmoSize?: number;
  /** Snapping values */
  snapTranslation?: number;
  snapRotation?: number; // in degrees
  snapScale?: number;
}

/** Context for tools plugins */
export interface ToolsPluginContext extends PluginContext {
  /** Methods to interact with the engine and scene */
  engine: {
    /** Get selected objects */
    getSelectedObjects: () => string[];
    /** Set selected objects */
    setSelectedObjects: (objectIds: string[]) => void;
    /** Add to selection */
    addToSelection: (objectId: string) => void;
    /** Remove from selection */
    removeFromSelection: (objectId: string) => void;
    /** Clear selection */
    clearSelection: () => void;
  };
  /** Methods to interact with visual components */
  visual: {
    /** Get visual component by ID */
    getVisualComponent: (id: string) => VisualComponent | undefined;
    /** Create a visual helper/gizmo */
    createHelper: (type: string, options?: Record<string, any>) => VisualComponent;
  };
}

/** Base class for tools plugins */
export abstract class ToolsPlugin extends Plugin {
  /** Initialize the tools plugin */
  abstract initialize(context: ToolsPluginContext, options: Record<string, any>): Promise<void> | void;
}

/** Transform tools plugin (move, rotate, scale) */
export class TransformToolsPlugin implements Plugin {
  private showGizmos: boolean = true;
  private gizmoSize: number = 1.0;
  private snapTranslation: number = 0;
  private snapRotation: number = 0; // degrees
  private snapScale: number = 0;
  private currentMode: 'move' | 'rotate' | 'scale' | null = null;
  private isDragging: boolean = false;
  private dragStartData: {
    mode: 'move' | 'rotate' | 'scale';
    objectId: string;
    startPosition: [number, number, number];
    startRotation: [number, number, number];
    startScale: [number, number, number];
    startMouseX: number;
    startMouseY: number;
  } | null = null;
  
  constructor(options: TransformToolsOptions = {}) {
    this.showGizmos = options.showGizmos ?? true;
    this.gizmoSize = options.gizmoSize ?? 1.0;
    this.snapTranslation = options.snapTranslation ?? 0;
    this.snapRotation = options.snapRotation ?? 0;
    this.snapScale = options.snapScale ?? 0;
  }
  
  /** Get plugin metadata */
  getMetadata(): PluginMetadata {
    return {
      id: 'transform-tools',
      name: 'Transform Tools',
      description: 'Provides move, rotate, and scale tools for manipulating objects',
      version: '1.0.0',
      author: 'Custom Engine Team',
      dependencies: []
    };
  }
  
  /** Initialize the plugin */
  async initialize(context: PluginContext, options: TransformToolsOptions): Promise<void> {
    const ctx = context as ToolsPluginContext;
    
    // Store options
    this.showGizmos = options.showGizmos ?? this.showGizmos;
    this.gizmoSize = options.gizmoSize ?? this.gizmoSize;
    this.snapTranslation = options.snapTranslation ?? this.snapTranslation;
    this.snapRotation = options.snapRotation ?? this.snapRotation;
    this.snapScale = options.snapScale ?? this.snapScale;
    
    // Set up event listeners for input
    // In a real implementation, we'd set up mouse/keyboard listeners here
    // For now, we'll just provide the API
    
    // Listen for selection changes to update gizmos
    // This would be implemented by listening to engine events
  }
  
  /** Set the current transform mode */
  setMode(mode: 'move' | 'rotate' | 'scale' | null): void {
    this.currentMode = mode;
    // In a real implementation, we'd update the cursor and show appropriate gizmo
  }
  
  /** Get the current transform mode */
  getMode(): 'move' | 'rotate' | 'scale' | null {
    return this.currentMode;
  }
  
  /** Start transforming selected objects */
  startTransform(objectId: string, mode: 'move' | 'rotate' | 'scale', 
                 startMouseX: number, startMouseY: number): void {
    const ctx = this.context as ToolsPluginContext;
    if (!ctx) {
      throw new Error('Plugin not initialized');
    }
    
    const object = ctx.engine.getSelectedObjects().find(id => id === objectId) 
                   && ctx.visual.getVisualComponent(objectId);
    
    if (!object) {
      return;
    }
    
    this.isDragging = true;
    this.dragStartData = {
      mode,
      objectId,
      startPosition: [...object.localPosition],
      startRotation: [...object.localRotation],
      startScale: [...object.localScale],
      startMouseX,
      startMouseY
    };
  }
  
  /** Update transform based on mouse movement */
  updateTransform(mouseX: number, mouseY: number): void {
    if (!this.isDragging || !this.dragStartData) {
      return;
    }
    
    const ctx = this.context as ToolsPluginContext;
    if (!ctx) {
      return;
    }
    
    const object = ctx.visual.getVisualComponent(this.dragStartData.objectId);
    if (!object) {
      this.endTransform();
      return;
    }
    
    const dx = mouseX - this.dragStartData.startMouseX;
    const dy = mouseY - this.dragStartData.startMouseY;
    
    // Convert mouse delta to world space (simplified)
    // In a real implementation, we'd use ray casting and proper transforms
    const sensitivity = 0.01;
    const deltaX = dx * sensitivity;
    const deltaY = -dy * sensitivity; // Inverted Y for screen coordinates
    
    switch (this.dragStartData.mode) {
      case 'move':
        let newPos = [
          this.dragStartData.startPosition[0] + deltaX,
          this.dragStartData.startPosition[1] + deltaY,
          this.dragStartData.startPosition[2] // Z movement would require different input
        ];
        
        // Apply snapping
        if (this.snapTranslation > 0) {
          newPos = newPos.map(pos => 
            Math.round(pos / this.snapTranslation) * this.snapTranslation
          );
        }
        
        object.setPosition(...newPos);
        break;
        
      case 'rotate':
        // For simplicity, we'll just rotate on Y axis (up/down) based on horizontal mouse movement
        let newRotY = this.dragStartData.startRotation[1] + deltaX * 100; // More sensitive for rotation
        
        // Apply snapping
        if (this.snapRotation > 0) {
          newRotY = Math.round(newRotY / this.snapRotation) * this.snapRotation;
        }
        
        object.setRotation(
          this.dragStartData.startRotation[0],
          newRotY,
          this.dragStartData.startRotation[2]
        );
        break;
        
      case 'scale':
        // Uniform scale based on mouse movement
        const scaleFactor = 1 + (deltaX + deltaY) * 0.01;
        let newScale = [
          this.dragStartData.startScale[0] * scaleFactor,
          this.dragStartData.startScale[1] * scaleFactor,
          this.dragStartData.startScale[2] * scaleFactor
        ];
        
        // Apply snapping
        if (this.snapScale > 0) {
          newScale = newScale.map(s => 
            Math.round(s / this.snapScale) * this.snapScale
          );
        }
        
        object.setScale(...newScale);
        break;
    }
  }
  
  /** End the transform operation */
  endTransform(): void {
    if (!this.isDragging) {
      return;
    }
    
    this.isDragging = false;
    this.dragStartData = null;
    // In a real implementation, we might want to snap to final values or save undo state
  }
  
  /** Check if currently transforming */
  isTransforming(): boolean {
    return this.isDragging;
  }
  
  /** Clean up resources */
  async dispose(): Promise<void> {
    this.endTransform();
    // Remove event listeners
  }
}

/** Animation tools plugin */
export class AnimationToolsPlugin implements Plugin {
  private animations: Map<string, {
    name: string;
    duration: number;
    loop: boolean;
    tracks: Array<{
      targetProperty: string; // e.g., "position", "rotation", "scale"
      keyframes: Array<{ time: number; value: any }>;
    }>;
  }> = new Map();
  
  private animationInstances: Map<string, {
    animationName: string;
    startTime: number;
    elapsedTime: number;
    isPlaying: boolean;
    isPaused: boolean;
    targetObjectId: string;
  }> = new Map();
  
  /** Get plugin metadata */
  getMetadata(): PluginMetadata {
    return {
      id: 'animation-tools',
      name: 'Animation Tools',
      description: 'Provides animation capabilities for objects',
      version: '1.0.0',
      author: 'Custom Engine Team',
      dependencies: []
    };
  }
  
  /** Initialize the plugin */
  async initialize(context: PluginContext, options: Record<string, any>): Promise<void> {
    const ctx = context as ToolsPluginContext;
    // Store reference for later use
    // We'll listen for engine update events to advance animations
  }
  
  /** Define an animation */
  defineAnimation(options: {
    name: string;
    duration: number;
    loop: boolean;
    tracks: Array<{
      targetProperty: string;
      keyframes: Array<{ time: number; value: any }>;
    }>;
  }): void {
    this.animations.set(options.name, {
      name: options.name,
      duration: options.duration,
      loop: options.loop ?? false,
      tracks: options.tracks
    });
  }
  
  /** Play an animation on an object */
  playAnimation(options: {
    objectId: string;
    animationName: string;
    startTime?: number;
    loop?: boolean;
  }): string {
    const instanceId = `${options.objectId}-${options.animationName}-${Date.now()}`;
    
    this.animationInstances.set(instanceId, {
      animationName: options.animationName,
      startTime: options.startTime ?? performance.now(),
      elapsedTime: 0,
      isPlaying: true,
      isPaused: false,
      targetObjectId: options.objectId
    });
    
    return instanceId;
  }
  
  /** Stop an animation instance */
  stopAnimation(instanceId: string): void {
    this.animationInstances.delete(instanceId);
  }
  
  /** Pause an animation instance */
  pauseAnimation(instanceId: string): void {
    const instance = this.animationInstances.get(instanceId);
    if (instance) {
      instance.isPaused = true;
    }
  }
  
  /** Resume an animation instance */
  resumeAnimation(instanceId: string): void {
    const instance = this.animationInstances.get(instanceId);
    if (instance) {
      instance.isPaused = false;
    }
  }
  
  /** Update animations (called by engine) */
  update(deltaTime: number): void {
    for (const [instanceId, instance] of this.animationInstances.entries()) {
      if (!instance.isPlaying || instance.isPaused) {
        continue;
      }
      
      instance.elapsedTime += deltaTime;
      
      const animation = this.animations.get(instance.animationName);
      if (!animation) {
        this.stopAnimation(instanceId);
        continue;
      }
      
      // Calculate normalized time [0, 1]
      let normalizedTime = instance.elapsedTime / animation.duration;
      
      if (animation.loop) {
        normalizedTime = normalizedTime % 1;
      } else {
        normalizedTime = Math.min(normalizedTime, 1);
        if (normalizedTime >= 1) {
          // Animation finished
          this.stopAnimation(instanceId);
          continue;
        }
      }
      
      // Apply animation to target object
      this.applyAnimation(instance, animation, normalizedTime);
    }
  }
  
  /** Apply animation to an object */
  private applyAnimation(instance: any, animation: any, normalizedTime: number): void {
    const ctx = this.context as ToolsPluginContext;
    if (!ctx) {
      return;
    }
    
    const object = ctx.visual.getVisualComponent(instance.targetObjectId);
    if (!object) {
      return;
    }
    
    // Apply each track
    for (const track of animation.tracks) {
      // Find keyframes that surround the current time
      const keyframes = track.keyframes;
      if (keyframes.length === 0) {
        continue;
      }
      
      if (keyframes.length === 1) {
        // Only one keyframe, just use its value
        this.setObjectProperty(object, track.targetProperty, keyframes[0].value);
        continue;
      }
      
      // Find surrounding keyframes
      let prevKeyframe = keyframes[0];
      let nextKeyframe = keyframes[keyframes.length - 1];
      
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (keyframes[i].time <= normalizedTime && keyframes[i + 1].time >= normalizedTime) {
          prevKeyframe = keyframes[i];
          nextKeyframe = keyframes[i + 1];
          break;
        }
      }
      
      // Interpolate between keyframes
      const timeRange = nextKeyframe.time - prevKeyframe.time;
      if (timeRange === 0) {
        this.setObjectProperty(object, track.targetProperty, prevKeyframe.value);
        continue;
      }
      
      const localTime = (normalizedTime - prevKeyframe.time) / timeRange;
      const interpolatedValue = this.interpolateValue(
        prevKeyframe.value, 
        nextKeyframe.value, 
        localTime
      );
      
      this.setObjectProperty(object, track.targetProperty, interpolatedValue);
    }
  }
  
  /** Set a property on an object */
  private setObjectProperty(object: VisualComponent, property: string, value: any): void {
    switch (property) {
      case 'position':
        if (Array.isArray(value) && value.length === 3) {
          object.setPosition(value[0], value[1], value[2]);
        }
        break;
      case 'rotation':
        if (Array.isArray(value) && value.length === 3) {
          object.setRotation(value[0], value[1], value[2]);
        }
        break;
      case 'scale':
        if (Array.isArray(value) && value.length === 3) {
          object.setScale(value[0], value[1], value[2]);
        }
        break;
      // Add more properties as needed
      default:
        // For custom properties, we could use a data map
        // object.setData(property, value);
        break;
    }
  }
  
  /** Interpolate between two values */
  private interpolateValue(start: any, end: any, t: number): any {
    if (typeof start === 'number' && typeof end === 'number') {
      return start + (end - start) * t;
    }
    
    if (Array.isArray(start) && Array.isArray(end) && start.length === end.length) {
      const result: number[] = [];
      for (let i = 0; i < start.length; i++) {
        result[i] = start[i] + (end[i] - start[i]) * t;
      }
      return result;
    }
    
    // For other types, just return the end value if t > 0.5, otherwise start
    return t > 0.5 ? end : start;
  }
  
  /** Clean up resources */
  async dispose(): Promise<void> {
    this.animationInstances.clear();
    this.animations.clear();
  }
}

/** Physics tools plugin (basic) */
export class PhysicsToolsPlugin implements Plugin {
  private gravity: [number, number, number] = [0, -9.81, 0];
  private timeStep: number = 1/60;
  private physicsObjects: Map<string, {
    mass: number;
    velocity: [number, number, number];
    acceleration: [number, number, number];
    forces: [number, number, number][];
    isStatic: boolean;
    collides: boolean;
    restitution: number;
    friction: number;
  }> = new Map();
  
  private simulationInterval: number | null = null;
  private isSimulating: boolean = false;
  
  /** Get plugin metadata */
  getMetadata(): PluginMetadata {
    return {
      id: 'physics-tools',
      name: 'Physics Tools',
      description: 'Provides basic physics simulation for objects',
      version: '1.0.0',
      author: 'Custom Engine Team',
      dependencies: []
    };
  }
  
  /** Initialize the plugin */
  async initialize(context: PluginContext, options: Record<string, any>): Promise<void> {
    const ctx = context as ToolsPluginContext;
    // Store reference for later use
    // We'll listen for engine update events to step physics
  }
  
  /** Register a physics object */
  registerPhysicsObject(options: {
    objectId: string;
    mass: number;
    isStatic?: boolean;
    collides?: boolean;
    restitution?: number;
    friction?: number;
  }): void {
    this.physicsObjects.set(options.objectId, {
      mass: options.mass,
      velocity: [0, 0, 0],
      acceleration: [0, 0, 0],
      forces: [],
      isStatic: options.isStatic ?? false,
      collides: options.collides ?? true,
      restitution: options.restitution ?? 0.5,
      friction: options.friction ?? 0.5
    });
  }
  
  /** Unregister a physics object */
  unregisterPhysicsObject(objectId: string): void {
    this.physicsObjects.delete(objectId);
  }
  
  /** Apply a force to a physics object */
  applyForce(objectId: string, force: [number, number, number]): void {
    const obj = this.physicsObjects.get(objectId);
    if (!obj || obj.isStatic) {
      return;
    }
    
    obj.forces.push(force);
  }
  
  /** Set velocity of a physics object */
  setVelocity(objectId: string, velocity: [number, number, number]): void {
    const obj = this.physicsObjects.get(objectId);
    if (!obj) {
      return;
    }
    
    obj.velocity = [...velocity];
  }
  
  /** Start physics simulation */
  startSimulation(): void {
    if (this.isSimulating) {
      return;
    }
    
    this.isSimulating = true;
    this.simulationInterval = setInterval(() => {
      this.stepPhysics(this.timeStep);
    }, this.timeStep * 1000);
  }
  
  /** Stop physics simulation */
  stopSimulation(): void {
    if (!this.isSimulating) {
      return;
    }
    
    this.isSimulating = false;
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
  
  /** Step the physics simulation */
  private stepPhysics(dt: number): void {
    // Apply gravity to all non-static objects
    for (const [objectId, obj] of this.physicsObjects.entries()) {
      if (obj.isStatic) {
        continue;
      }
      
      // Reset acceleration
      obj.acceleration = [0, 0, 0];
      
      // Apply gravity
      obj.acceleration[0] += this.gravity[0] / obj.mass;
      obj.acceleration[1] += this.gravity[1] / obj.mass;
      obj.acceleration[2] += this.gravity[2] / obj.mass;
      
      // Apply forces
      for (const force of obj.forces) {
        obj.acceleration[0] += force[0] / obj.mass;
        obj.acceleration[1] += force[1] / obj.mass;
        obj.acceleration[2] += force[2] / obj.mass;
      }
      
      // Clear forces for next frame
      obj.forces = [];
      
      // Update velocity
      obj.velocity[0] += obj.acceleration[0] * dt;
      obj.velocity[1] += obj.acceleration[1] * dt;
      obj.velocity[2] += obj.acceleration[2] * dt;
      
      // Apply friction (simple approximation)
      const speed = Math.sqrt(
        obj.velocity[0] * obj.velocity[0] + 
        obj.velocity[1] * obj.velocity[1] + 
        obj.velocity[2] * obj.velocity[2]
      );
      
      if (speed > 0.001) {
        const frictionForce = obj.friction * obj.mass * 9.81; // Normal force * friction coefficient
        const frictionDecel = frictionForce / obj.mass;
        
        if (frictionDecel * dt > speed) {
          // Stop completely
          obj.velocity = [0, 0, 0];
        } else {
          // Apply friction opposite to velocity
          obj.velocity[0] -= (obj.velocity[0] / speed) * frictionDecel * dt;
          obj.velocity[1] -= (obj.velocity[1] / speed) * frictionDecel * dt;
          obj.velocity[2] -= (obj.velocity[2] / speed) * frictionDecel * dt;
        }
      }
      
      // Update position
      const ctx = this.context as ToolsPluginContext;
      if (ctx) {
        const visualObj = ctx.visual.getVisualComponent(objectId);
        if (visualObj) {
          const currentPos = visualObj.localPosition;
          visualObj.setPosition(
            currentPos[0] + obj.velocity[0] * dt,
            currentPos[1] + obj.velocity[1] * dt,
            currentPos[2] + obj.velocity[2] * dt
          );
        }
      }
    }
    
    // TODO: Handle collisions between objects
  }
  
  /** Get velocity of a physics object */
  getVelocity(objectId: string): [number, number, number] | null {
    const obj = this.physicsObjects.get(objectId);
    if (!obj) {
      return null;
    }
    
    return [...obj.velocity];
  }
  
  /** Clean up resources */
  async dispose(): Promise<void> {
    this.stopSimulation();
    this.physicsObjects.clear();
  }
}