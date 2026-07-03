/**
 * Canvas Tracker
 * Ensures only one WebGL/WebGPU canvas context is active at a time.
 * Useful for debugging context leaks.
 */

export class CanvasTracker {
  private static activeContexts = new Set<HTMLCanvasElement>();

  public static register(canvas: HTMLCanvasElement): void {
    if (this.activeContexts.size >= 1 && !this.activeContexts.has(canvas)) {
      console.warn(
        `[CanvasTracker] WARNING: Multiple canvas contexts detected! 
         Active contexts: ${this.activeContexts.size}. 
         Adding new canvas:`,
        canvas
      );
    }
    this.activeContexts.add(canvas);
  }

  public static unregister(canvas: HTMLCanvasElement): void {
    this.activeContexts.delete(canvas);
  }

  public static getActiveCount(): number {
    return this.activeContexts.size;
  }

  public static clear(): void {
    this.activeContexts.clear();
  }
}
