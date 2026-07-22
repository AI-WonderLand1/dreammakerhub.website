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
export declare class WebGLGestureBridge {
    private engine;
    private intentDetector;
    private samples;
    private selectedMeshIndex;
    private config;
    private animationFrameId;
    private lastEvent;
    private canvas;
    private mouseDown;
    private lastMouseX;
    private lastMouseY;
    private lastMouseTime;
    private readonly SMOOTH_WEIGHT;
    private smoothRot;
    private smoothPos;
    private smoothScale;
    constructor(config?: Partial<GestureBridgeConfig>);
    selectMesh(index: number): void;
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
    refreshEngine(): void;
    private update;
    private applyToEngine;
    get lastKnownEvent(): GestureEvent | null;
    destroy(): void;
}
