export interface OptimizeOptions {
  draco?: boolean;
  meshopt?: boolean;
  webp?: boolean;
  quality?: number;
  maxTexSize?: number;
}

const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://optimizer-service:3090';

export async function optimizeAsset(
  buffer: ArrayBuffer,
  options: OptimizeOptions = {}
): Promise<ArrayBuffer> {
  const { quality = 85, maxTexSize = 1024 } = options;

  try {
    const response = await fetch(`${OPTIMIZER_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Quality': String(quality),
        'X-MaxTexSize': String(maxTexSize),
      },
      body: buffer,
    });

    if (!response.ok) {
      throw new Error(`Optimization failed: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch {
    return buffer;
  }
}

export async function downloadAndOptimizeAsset(
  assetUrl: string,
  options: OptimizeOptions = {}
): Promise<ArrayBuffer> {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  return optimizeAsset(buffer, options);
}