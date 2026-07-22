import type { MotionSample } from './intent';
import type { LateralGesture } from './patterns';
export interface Vec3 {
    x: number;
    y: number;
    z: number;
}
export interface SpatialTransform {
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
}
export interface SpatialGesture {
    gesture: LateralGesture;
    transform: SpatialTransform;
    confidence: number;
}
export declare function motionSampleToVec3(sample: MotionSample): Vec3;
export declare function computeSpatialTransform(samples: MotionSample[], gesture: LateralGesture): SpatialTransform;
export declare function classifySpatialGesture(samples: MotionSample[], lateralGesture: LateralGesture): SpatialGesture;
export declare function normalizeSpatialCoordinates(coords: {
    x: number;
    y: number;
    z: number;
}, frame: {
    width: number;
    height: number;
    depth?: number;
}): Vec3;
