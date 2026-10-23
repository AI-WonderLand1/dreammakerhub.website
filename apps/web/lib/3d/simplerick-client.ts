import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

type RenderTicket = {
  jobId: string;
  userId: string;
  assetId: string;
  projectId: string | null;
  label: string;
  expiresAt: number;
};

export class SimpleRickError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

function configuration() {
  const url = process.env.SIMPLERICK_GPU_URL?.trim();
  const token = process.env.SIMPLERICK_API_TOKEN?.trim();
  if (!url || !token || token.length < 32) {
    throw new SimpleRickError("SimpleRick GPU service is not configured", 503);
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SimpleRickError("SimpleRick GPU URL is invalid", 503);
  }
  const local = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && local)) {
    throw new SimpleRickError("SimpleRick GPU requires HTTPS", 503);
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new SimpleRickError("SimpleRick GPU URL must not contain credentials or query parameters", 503);
  }
  return { url: parsed.origin + parsed.pathname.replace(/\/$/, ""), token };
}

/** Verify the configured GPU is reachable before taking a customer's render credit. */
export async function assertSimpleRickGpuReady(): Promise<void> {
  await requestGpu("/health", {}, 8_000);
}

async function requestGpu(path: string, init: RequestInit = {}, timeout = 20_000): Promise<Response> {
  const { url, token } = configuration();
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), "X-Render-Token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new SimpleRickError("SimpleRick GPU is unreachable. Try again later", 503);
  }
  if (!response.ok) {
    if (response.status === 429) throw new SimpleRickError("SimpleRick GPU queue is busy. Try again later", 429);
    if (response.status === 404) throw new SimpleRickError("Generation job expired or was lost", 410);
    throw new SimpleRickError("SimpleRick GPU request failed", 502);
  }
  return response;
}

export async function submitSimpleRickImage(image: File): Promise<string> {
  const form = new FormData();
  form.append("image", image, image.name);
  const response = await requestGpu("/jobs", { method: "POST", body: form }, 30_000);
  const payload = await response.json() as { id?: string };
  if (!payload.id || !/^[0-9a-f-]{36}$/.test(payload.id)) {
    throw new SimpleRickError("GPU returned an invalid job ID");
  }
  return payload.id;
}

export async function simpleRickJobStatus(jobId: string): Promise<{ state: string; progress: number; error?: string }> {
  const response = await requestGpu(`/jobs/${encodeURIComponent(jobId)}`);
  const payload = await response.json() as { state?: string; progress?: number; error?: string };
  if (!payload.state || !["queued", "running", "complete", "failed"].includes(payload.state)) {
    throw new SimpleRickError("Invalid response from GPU service");
  }
  return { state: payload.state, progress: Math.max(0, Math.min(100, Number(payload.progress) || 0)), error: payload.error };
}

export async function downloadSimpleRickGlb(jobId: string): Promise<Buffer> {
  const response = await requestGpu(`/jobs/${encodeURIComponent(jobId)}/glb`, {}, 60_000);
  const maxBytes = 100 * 1024 * 1024;
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) throw new SimpleRickError("Generated GLB exceeds 100 MB", 502);
  const glb = Buffer.from(await response.arrayBuffer());
  if (glb.byteLength < 12 || glb.byteLength > maxBytes || glb.toString("ascii", 0, 4) !== "glTF") {
    throw new SimpleRickError("GPU did not return a valid-size GLB");
  }
  return glb;
}

function signature(encoded: string): string {
  const { token } = configuration();
  return createHmac("sha256", token).update(encoded).digest("base64url");
}

export function signSimpleRickJob(input: Omit<RenderTicket, "assetId" | "expiresAt">) {
  const ticket: RenderTicket = {
    ...input,
    assetId: `3d_${randomUUID()}`,
    expiresAt: Date.now() + 6 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifySimpleRickJob(token: string, userId: string): RenderTicket {
  const parts = token.split(".");
  if (parts.length !== 2 || token.length > 1600) throw new SimpleRickError("Invalid job ticket", 403);
  const expected = Buffer.from(signature(parts[0]));
  const actual = Buffer.from(parts[1]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new SimpleRickError("Invalid job ticket", 403);
  }
  let ticket: RenderTicket;
  try {
    ticket = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as RenderTicket;
  } catch {
    throw new SimpleRickError("Invalid job ticket", 403);
  }
  if (ticket.userId !== userId || ticket.expiresAt <= Date.now() ||
      !/^[0-9a-f-]{36}$/.test(ticket.jobId) || !/^3d_[0-9a-f-]{36}$/.test(ticket.assetId) ||
      typeof ticket.label !== "string" || ticket.label.length > 160 ||
      (ticket.projectId !== null && !/^[a-zA-Z0-9_-]{1,120}$/.test(ticket.projectId))) {
    throw new SimpleRickError("Job ticket is expired or invalid", 403);
  }
  return ticket;
}
