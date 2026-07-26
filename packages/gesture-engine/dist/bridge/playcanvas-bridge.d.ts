import { type LateralGesture } from '../core/patterns';
export interface GestureBridgeConfig {
    enabled: boolean;
    sensitivity: number;
    smoothing: number;
}
export interface GestureEvent {
    gesture: LateralGesture;
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    position: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
    confidence: number;
}
export declare class PlayCanvasGestureBridge {
    private app;
    private intentDetector;
    private samples;
    private targetEntity;
    private config;
    private animationFrameId;
    private lastEvent;
    private canvas;
    private mouseDown;
    private lastMouseX;
    private lastMouseY;
    private lastMouseTime;
    private accumulatedEvent;
    constructor(app: any, config?: Partial<GestureBridgeConfig>);
    setTarget(entity: any): void;
    enable(): void;
    disable(): void;
    attach(canvas: HTMLCanvasElement): void;
    detach(): void;
    private attachInputListeners;
    private detachInputListeners;
    private handleMouseDown;
    private handleMouseMove;
    private handleMouseUp;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
    private processInput;
    private startAnimationLoop;
    private stopAnimationLoop;
    private update;
    private applyToScene;
    private getDefaultTarget;
    private applyCameraTransform;
    private applyObjectTransform;
    get lastKnownEvent(): GestureEvent | null;
    destroy(): void;
}
