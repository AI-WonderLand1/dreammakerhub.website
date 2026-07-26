// core/patterns.ts
//
// Wave and swipe are both lateral hand motions and are indistinguishable
// by direction alone. Resolved by trajectory shape:
//   - wave  = oscillating motion, direction reverses 2+ times in the window
//   - swipe = ballistic motion, single accelerate-then-decelerate curve,
//             no direction reversal
export function classifyLateralMotion(samples) {
    if (samples.length < 4)
        return 'none';
    // Count direction reversals via sign changes in the x-velocity component
    let reversals = 0;
    for (let i = 1; i < samples.length; i++) {
        const prevDir = Math.sign(Math.cos(samples[i - 1].direction));
        const currDir = Math.sign(Math.cos(samples[i].direction));
        if (prevDir !== 0 && currDir !== 0 && prevDir !== currDir) {
            reversals++;
        }
    }
    // Ballistic check: velocity rises to a peak, then drops off sharply
    const velocities = samples.map(s => s.velocity);
    const peakIdx = velocities.indexOf(Math.max(...velocities));
    const decelerating = peakIdx > 0 &&
        peakIdx < velocities.length - 1 &&
        velocities[velocities.length - 1] < velocities[peakIdx] * 0.4;
    if (reversals >= 2)
        return 'wave';
    if (reversals === 0 && decelerating)
        return 'swipe';
    return 'none'; // ambiguous mid-gesture — don't fire either action yet
}
