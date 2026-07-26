import type { MotionSample } from './intent';
export type LateralGesture = 'wave' | 'swipe' | 'none';
export declare function classifyLateralMotion(samples: MotionSample[]): LateralGesture;
