// core/timing.ts
//
// Fixed 60fps was unrealistic on webcam-only, non-GPU hardware. This
// measures rolling frame duration and steps the target rate down (or
// back up) gradually, instead of assuming a fixed rate and dropping
// frames unpredictably when hardware can't keep up.

export const TIMING = {
  targetFrameRate: 60,   // ideal, GPU-available hardware
  minFrameRate: 24,      // floor — tracking becomes unreliable below this
  debounce: 300,         // ms — ignore repeated triggers
  holdThreshold: 1500,   // ms — hold duration for intentional gesture
  intentWindow: 800,     // ms — time to confirm gesture is directed at screen
  smoothing: 0.7,        // 0-1, higher = smoother but slower response
}

export class AdaptiveFrameRate {
  private frameTimes: number[] = []
  private currentTarget: number = TIMING.targetFrameRate

  /** Call once per processed frame with how long it took, in ms */
  recordFrame(durationMs: number) {
    this.frameTimes.push(durationMs)
    if (this.frameTimes.length > 30) this.frameTimes.shift()

    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    const achievableFps = 1000 / avg

    if (achievableFps < this.currentTarget * 0.8) {
      // Hardware is struggling — step down toward what it can sustain
      this.currentTarget = Math.max(TIMING.minFrameRate, Math.floor(achievableFps))
    } else if (
      achievableFps > this.currentTarget * 1.2 &&
      this.currentTarget < TIMING.targetFrameRate
    ) {
      // Headroom available — step back up gradually
      this.currentTarget = Math.min(TIMING.targetFrameRate, this.currentTarget + 5)
    }
  }

  /** ms to wait between frame captures at the current target rate */
  get targetIntervalMs(): number {
    return 1000 / this.currentTarget
  }

  get fps(): number {
    return this.currentTarget
  }
}