import "server-only";

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_MODEL_BYTES = 100 * 1024 * 1024;

export class HunyuanConfigurationError extends Error {}
export class HunyuanGenerationError extends Error {}

function getEndpoint(): string {
  const endpoint = process.env.HUNYUAN3D_API_URL?.trim();
  if (!endpoint) {
    throw new HunyuanConfigurationError("HUNYUAN3D_API_URL is not configured");
  }
  return endpoint;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, model/gltf-binary, application/octet-stream",
  };

  const token = process.env.HUNYUAN3D_API_TOKEN?.trim();
  if (token) headers.authorization = `Bearer ${token}`;

  return headers;
}

async function readBinaryResponse(response: Response): Promise<Buffer> {
  const declared = Number(response.headers.get("content-length") || "0");
  if (declared > MAX_MODEL_BYTES) {
    throw new HunyuanGenerationError("Generated model exceeds the 100 MB limit");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new HunyuanGenerationError("3D provider returned an empty model");
  }
  if (buffer.byteLength > MAX_MODEL_BYTES) {
    throw new HunyuanGenerationError("Generated model exceeds the 100 MB limit");
  }

  return buffer;
}

async function downloadModel(url: string): Promise<Buffer> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new HunyuanGenerationError("3D provider returned an invalid model URL");
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new HunyuanGenerationError("3D provider returned an unsupported model URL");
  }

  const response = await fetch(parsed, {
    redirect: "follow",
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new HunyuanGenerationError(
      `Unable to download generated model (${response.status})`,
    );
  }

  return readBinaryResponse(response);
}

function nestedString(payload: any, keys: string[]): string | null {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], payload);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function generateHunyuanGlb(input: {
  prompt: string;
  negativePrompt?: string;
}): Promise<Buffer> {
  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt: input.prompt,
      negative_prompt: input.negativePrompt || undefined,
      format: "glb",
    }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 500);
    throw new HunyuanGenerationError(
      `3D provider failed (${response.status})${detail ? `: ${detail}` : ""}`,
    );
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (
    contentType.includes("model/gltf-binary") ||
    contentType.includes("application/octet-stream")
  ) {
    return readBinaryResponse(response);
  }

  const payload = await response.json().catch(() => null);
  if (!payload) {
    throw new HunyuanGenerationError("3D provider returned an unreadable response");
  }

  const base64 = nestedString(payload, [
    "glb_base64",
    "data.glb_base64",
    "result.glb_base64",
  ]);
  if (base64) {
    const model = Buffer.from(base64, "base64");
    if (!model.byteLength || model.byteLength > MAX_MODEL_BYTES) {
      throw new HunyuanGenerationError("3D provider returned an invalid GLB payload");
    }
    return model;
  }

  const modelUrl = nestedString(payload, [
    "url",
    "model_url",
    "output_url",
    "data.url",
    "data.model_url",
    "result.url",
    "result.model_url",
  ]);
  if (modelUrl) return downloadModel(modelUrl);

  throw new HunyuanGenerationError(
    "3D provider response did not contain GLB bytes, base64, or a model URL",
  );
}
