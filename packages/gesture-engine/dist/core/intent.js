// core/intent.ts
//
// Determines whether a detected hand motion is an intentional command
// vs incidental movement (talking, eating, adjusting glasses, fidgeting).
// This is the highest-risk part of the gesture system — build and test
// this before vocabulary.ts. If it doesn't work reliably, nothing built
// on top of it will either.
const INTERACTION_ZONE = {
    minY: 0.15, // top 15% of frame excluded (above head)
    maxY: 0.85, // bottom 15% excluded (below typical desk level)
    minX: 0.1,
    maxX: 0.9,
};
const THRESHOLDS = {
    minVelocity: 0.15, // normalized units/sec — filters idle drift
    directionConsistency: 0.7, // 0-1 — circular resultant length cutoff
    minSamples: 4, // minimum frames buffered before judging
};
/**
 * Buffers recent motion samples over a sliding time window and decides
 * whether the current gesture candidate is directed at the screen.
 *
 * Usage: call addSample() every tracked frame, call evaluate() when a
 * gesture candidate needs to be confirmed before dispatching.
 */
export class IntentDetector {
    buffer = [];
    windowMs;
    constructor(windowMs = 800) {
        this.windowMs = windowMs;
    }
    addSample(sample) {
        this.buffer.push(sample);
        const cutoff = sample.timestamp - this.windowMs;
        this.buffer = this.buffer.filter(s => s.timestamp >= cutoff);
    }
    evaluate() {
        if (this.buffer.length < THRESHOLDS.minSamples) {
            return { isIntentional: false, confidence: 0, reason: 'insufficient_samples' };
        }
        const latest = this.buffer[this.buffer.length - 1];
        // Gate 1: spatial — is the hand where deliberate gestures happen?
        const inZone = latest.wrist.x >= INTERACTION_ZONE.minX &&
            latest.wrist.x <= INTERACTION_ZONE.maxX &&
            latest.wrist.y >= INTERACTION_ZONE.minY &&
            latest.wrist.y <= INTERACTION_ZONE.maxY;
        if (!inZone) {
            return { isIntentional: false, confidence: 0, reason: 'outside_interaction_zone' };
        }
        // Gate 2: velocity — filters idle drift / small adjustments
        const avgVelocity = this.buffer.reduce((sum, s) => sum + s.velocity, 0) / this.buffer.length;
        if (avgVelocity < THRESHOLDS.minVelocity) {
            return { isIntentional: false, confidence: 0, reason: 'below_velocity_threshold' };
        }
        // Gate 3: direction consistency — deliberate gestures hold a direction;
        // incidental movement (talking, fidgeting) is noisy/erratic.
        const consistency = this.directionConsistency();
        const confidence = Math.min(1, (avgVelocity / THRESHOLDS.minVelocity) * consistency);
        if (consistency < THRESHOLDS.directionConsistency) {
            return { isIntentional: false, confidence, reason: 'erratic_direction' };
        }
        return { isIntentional: true, confidence, reason: 'confirmed' };
    }
    /**
     * Circular mean resultant length: 1 = perfectly consistent direction,
     * 0 = random/erratic. Standard measure from directional statistics —
     * more robust than averaging raw angles, which breaks down near the
     * 0/2π wraparound.
     */
    directionConsistency() {
        if (this.buffer.length < 2)
            return 0;
        const dirs = this.buffer.map(s => s.direction);
        const sumX = dirs.reduce((a, d) => a + Math.cos(d), 0);
        const sumY = dirs.reduce((a, d) => a + Math.sin(d), 0);
        return Math.sqrt(sumX * sumX + sumY * sumY) / dirs.length;
    }
    reset() {
        this.buffer = [];
    }
}
