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
type MeshLike = {
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    scaling: {
        x: number;
        y: number;
        z: number;
    };
};
type CameraLike = {
    alpha: number;
    beta: number;
    radius: number;
    target: {
        x: number;
        y: number;
        z: number;
    };
};
export declare class BabylonGestureBridge {
    private intentDetector;
    private samples;
    private config;
    private animationFrameId;
    private lastEvent;
    private canvas;
    private targetMesh;
    private targetCamera;
    private mouseDown;
    private lastMouseX;
    private lastMouseY;
    private lastMouseTime;
    private readonly SMOOTH_WEIGHT;
    private smoothRot;
    private smoothPos;
    private smoothScale;
    constructor(config?: Partial<GestureBridgeConfig>);
    updateConfig(partial: Partial<GestureBridgeConfig>): void;
    setTargetMesh(mesh: MeshLike | null): void;
    setTargetCamera(camera: CameraLike | null): void;
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
    private applyGesture;
    private applyToMesh;
    private applyToCamera;
    get lastKnownEvent(): GestureEvent | null;
    resetSamples(): void;
    destroy(): void;
}
export {};
