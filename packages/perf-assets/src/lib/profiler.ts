import * as pc from 'playcanvas';

export interface PerfMetrics {
  fps: number;
  frameTimeMs: number;
  frameTimeMin: number;
  frameTimeMax: number;
  drawCalls: number;
  triangleCount: number;
  objectCount: number;
  textureMemMB: number;
}

interface FrameTimeStats {
  min: number;
  max: number;
  avg: number;
  samples: number[];
}

const FPS_SAMPLES = 60;
const frameTimes: FrameTimeStats = { min: 0, max: 0, avg: 0, samples: [] };

let active = false;
let lastTime = 0;
let appRef: pc.Application | null = null;

export function startProfiling(app: pc.Application): void {
  if (active) return;
  
  appRef = app;
  active = true;
  lastTime = performance.now();
  
  app.on('update', onUpdate);
  
}


export function stopProfiling(app: pc.Application): void {
  if (!active) return;
  
  active = false;
  app.off('update', onUpdate);
  appRef = null;
  frameTimes.samples = [];
  
}


function onUpdate(_dt: number): void {
  const now = performance.now();
  const frameTime = now - lastTime;
  lastTime = now;
  
  if (frameTimes.samples.length >= FPS_SAMPLES) {
    frameTimes.samples.shift();
  }
  frameTimes.samples.push(frameTime);
  
  const sum = frameTimes.samples.reduce((a, b) => a + b, 0);
  frameTimes.avg = sum / frameTimes.samples.length;
  frameTimes.min = Math.min(...frameTimes.samples);
  frameTimes.max = Math.max(...frameTimes.samples);
  
  if (!appRef) return;
  
  const metrics = getMetrics();
  void metrics;
}

export function getMetrics(): PerfMetrics {
  const fps = frameTimes.samples.length > 0 
    ? 1000 / frameTimes.avg 
    : 0;
  
  let drawCalls = 0;
  let triangleCount = 0;
  let objectCount = 0;
  
  if (appRef) {
    const renderer = (appRef as unknown as { renderer: { numDrawCalls?: number; numTriangles?: number } }).renderer;
    if (renderer) {
      drawCalls = renderer.numDrawCalls ?? 0;
      triangleCount = renderer.numTriangles ?? 0;
    }
    
    const countObjects = (node: pc.GraphNode) => {
      objectCount++;
      (node.children as pc.GraphNode[])?.forEach(countObjects);
    };
    
    (appRef.root.children as pc.GraphNode[])?.forEach(countObjects);
  }
  
  return {
    fps: Math.round(fps * 10) / 10,
    frameTimeMs: frameTimes.avg,
    frameTimeMin: frameTimes.min,
    frameTimeMax: frameTimes.max,
    drawCalls,
    triangleCount,
    objectCount,
    textureMemMB: 0,
  };
}

export function isActive(): boolean {
  return active;
}