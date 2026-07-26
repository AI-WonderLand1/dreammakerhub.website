export interface MotionSample {
    timestamp: number;
    wrist: {
        x: number;
        y: number;
        z: number;
    };
    velocity: number;
    direction: number;
}
export interface IntentResult {
    isIntentional: boolean;
    confidence: number;
    reason: string;
}
/**
 * Buffers recent motion samples over a sliding time window and decides
 * whether the current gesture candidate is directed at the screen.
 *
 * Usage: call addSample() every tracked frame, call evaluate() when a
 * gesture candidate needs to be confirmed before dispatching.
 */
export declare class IntentDetector {
    private buffer;
    private windowMs;
    constructor(windowMs?: number);
    addSample(sample: MotionSample): void;
    evaluate(): IntentResult;
    /**
     * Circular mean resultant length: 1 = perfectly consistent direction,
     * 0 = random/erratic. Standard measure from directional statistics —
     * more robust than averaging raw angles, which breaks down near the
     * 0/2π wraparound.
     */
    private directionConsistency;
    reset(): void;
}
