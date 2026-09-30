import "server-only";

const DEFAULT_TIMEOUT_MS = 8 * 60 * 1000;
const MAX_MODEL_BYTES = 100 * 1024 * 1024;

export class HunyuanConfigurationError extends Error {}
export class HunyuanGenerationError extends Error {}

function getBaseUrl(): string {
  const value = process.env.HUNYUAN3D_API_URL?.trim();
  if (!value) {
    throw new HunyuanConfigurationError("HUNYUAN3D_API_URL is not configured");
  }

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    throw new HunyuanConfigurationError("HUNYUAN3D_API_URL is invalid");
  }
}

function getHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJson) headers["content-type"] = "application/json";

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
  if (!buffer.byteLength) {
    throw new HunyuanGenerationError("3D provider returned an empty model");
  }
  if (buffer.byteLength > MAX_MODEL_BYTES) {
    throw new HunyuanGenerationError("Generated model exceeds the 100 MB limit");
  }
  return buffer;
}

async function downloadModel(url: string): Promise<Buffer> {
  const parsed = new URL(url);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new HunyuanGenerationError("3D provider returned an unsupported model URL");
  }

  const response = await fetch(parsed, {
    headers: getHeaders(false),
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

function findGlbUrl(value: unknown): string | null {
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value) && /\.glb(?:\?|$)/i.test(value)) return value;
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findGlbUrl(item);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["url", "path", "download_url", "value"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && /^https?:\/\//i.test(candidate)) {
        if (/\.glb(?:\?|$)/i.test(candidate) || key === "url") return candidate;
      }
    }
    for (const nested of Object.values(record)) {
      const found = findGlbUrl(nested);
      if (found) return found;
    }
  }

  return null;
}

function parseCompletedSse(body: string): unknown {
  const lines = body.split(/\r?\n/);
  let currentEvent = "";
  for (const line of lines) {
    if (line.startsWith("event:")) {
      currentEvent = line.slice(6).trim();
      continue;
    }
    if (!line.startsWith("data:")) continue;

    const raw = line.slice(5).trim();
    if (currentEvent === "error") {
      throw new HunyuanGenerationError(raw || "Hunyuan Space generation failed");
    }
    if (currentEvent !== "complete") continue;

    try {
      return JSON.parse(raw);
    } catch {
      throw new HunyuanGenerationError("Hunyuan Space returned invalid completion data");
    }
  }

  throw new HunyuanGenerationError("Hunyuan Space did not return a completed result");
}

export async function generateHunyuanGlb(input: {
  prompt: string;
  negativePrompt?: string;
}): Promise<Buffer> {
  const baseUrl = getBaseUrl();
  const apiName = process.env.HUNYUAN3D_API_NAME?.trim() || "generate_3d_text";
  const submitUrl = `${baseUrl}/gradio_api/call/${encodeURIComponent(apiName)}`;

  const submit = await fetch(submitUrl, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify({
      data: [input.prompt, false],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!submit.ok) {
    const detail = (await submit.text().catch(() => "")).slice(0, 500);
    throw new HunyuanGenerationError(
      `Hunyuan Space rejected the request (${submit.status})${detail ? `: ${detail}` : ""}`,
    );
  }

  const queued = (await submit.json().catch(() => null)) as { event_id?: string } | null;
  const eventId = queued?.event_id;
  if (!eventId) {
    throw new HunyuanGenerationError("Hunyuan Space did not return an event ID");
  }

  const result = await fetch(
    `${submitUrl}/${encodeURIComponent(eventId)}`,
    {
      headers: {
        ...getHeaders(false),
        accept: "text/event-stream",
      },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    },
  );

  if (!result.ok) {
    const detail = (await result.text().catch(() => "")).slice(0, 500);
    throw new HunyuanGenerationError(
      `Hunyuan Space result request failed (${result.status})${detail ? `: ${detail}` : ""}`,
    );
  }

  const payload = parseCompletedSse(await result.text());
  const modelUrl = findGlbUrl(payload);
  if (!modelUrl) {
    throw new HunyuanGenerationError("Hunyuan Space completed without a GLB URL");
  }

  return downloadModel(modelUrl);
}
