import * as pc from 'playcanvas';

export interface BenchmarkConfig {
  objectCount: number;
  durationSeconds?: number;
  checkIntervalMs?: number;
}

export interface BenchmarkResult {
  objectCount: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  avgFrameTimeMs: number;
  durationMs: number;
}

export async function runBenchmark(
  app: pc.Application,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  const { objectCount, durationSeconds = 10, checkIntervalMs = 500 } = config;
  
  const entities: pc.Entity[] = [];
  const fpsSamples: number[] = [];
  const frameTimeSamples: number[] = [];
  
  let lastTime = performance.now();
  let startTime = performance.now();
  
  for (let i = 0; i < objectCount; i++) {
    const entity = new pc.Entity(`benchmark_${i}`);
    entity.addComponent('render', { type: 'box' });
    entity.setPosition(
      Math.random() * 20 - 10,
      Math.random() * 20 - 10,
      Math.random() * 20 - 10
    );
    app.root.addChild(entity);
    entities.push(entity);
  }
  
  const onUpdate = (dt: number) => {
    const now = performance.now();
    const frameTime = now - lastTime;
    lastTime = now;
    
    frameTimeSamples.push(frameTime);
    
    if (frameTimeSamples.length > 60) {
      frameTimeSamples.shift();
    }
  };
  
  app.on('update', onUpdate);
  
  await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
  
  app.off('update', onUpdate);
  
  for (const entity of entities) {
    entity.destroy();
  }
  
  const avgFrameTime = frameTimeSamples.reduce((a, b) => a + b, 0) / frameTimeSamples.length;
  const avgFps = 1000 / avgFrameTime;
  const minFps = Math.min(...frameTimeSamples.map(t => 1000 / t));
  const maxFps = Math.max(...frameTimeSamples.map(t => 1000 / t));
  
  return {
    objectCount,
    avgFps: Math.round(avgFps * 10) / 10,
    minFps: Math.round(minFps * 10) / 10,
    maxFps: Math.round(maxFps * 10) / 10,
    avgFrameTimeMs: Math.round(avgFrameTime * 10) / 10,
    durationMs: performance.now() - startTime,
  };
}

export async function findPerformanceThreshold(
  app: pc.Application,
  startCount = 10,
  step = 10,
  targetFps = 30
): Promise<number> {
  let count = startCount;
  let lastStableCount = 0;
  
  while (true) {
    const result = await runBenchmark(app, { objectCount: count, durationSeconds: 5 });
    
    console.debug(
      `[perf-benchmark] Objects: ${count} | ` +
      `FPS: ${result.avgFps}`
    );
    
    if (result.avgFps < targetFps) {
      return lastStableCount > 0 ? lastStableCount : count - step;
    }
    
    lastStableCount = count;
    count += step;
  }
}