import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { requireUserId } from "@/lib/auth";
import { logUsage } from "@/lib/usage/log";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const PIXAZO_API_KEY = process.env.PIXAZO_API_KEY?.trim();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-2.5-sunburst";
const OPENAI_IMAGE_MODELS = [
  process.env.OPENAI_IMAGE_MODEL?.trim(),
  DEFAULT_OPENAI_IMAGE_MODEL,
  "gpt-image-2",
].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);

const ALLOWED_SIZES = new Set(["auto", "1024x1024", "1536x1024", "1024x1536"]);
const PIXAZO_GENERATE_URL = "https://gateway.pixazo.ai/flux/text-to-image";
const PIXAZO_MODEL = "flux-1-schnell";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

type GeneratedImage = {
  bytes: Buffer;
  provider: string;
  model: string;
};

type ImageGenerationResult = {
  image: GeneratedImage | null;
  attemptedProviders: string[];
  failures: string[];
};

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, maxLength) : "";
}

function geminiAspectRatio(size: string): string | undefined {
  switch (size) {
    case "1024x1024":
      return "1:1";
    case "1536x1024":
      return "3:2";
    case "1024x1536":
      return "2:3";
    default:
      return undefined;
  }
}

function extractPixazoMediaUrl(payload: any): string | null {
  const candidates = [
    payload?.imageUrl,
    payload?.image_url,
    payload?.url,
    payload?.media_url,
    typeof payload?.output?.media_url === "string" ? payload.output.media_url : null,
    Array.isArray(payload?.output) ? payload.output[0]?.url || payload.output[0] : null,
    typeof payload?.output === "string" ? payload.output : null,
    payload?.output?.url,
    Array.isArray(payload?.output?.media_url) ? payload.output.media_url[0] : null,
    payload?.data?.url,
    Array.isArray(payload?.data) ? payload.data[0]?.url : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:") return parsed.toString();
    } catch {}
  }
  return null;
}

async function downloadGeneratedImage(url: string): Promise<Buffer | null> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;

    const response = await fetch(parsed, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().startsWith("image/")) return null;

    const declaredLength = Number(response.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) return null;

    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null;
    return bytes;
  } catch (error) {
    logger.error("Generated image download failed:", error);
    return null;
  }
}

async function generateWithPixazo(prompt: string, failures: string[]): Promise<GeneratedImage | null> {
  if (!PIXAZO_API_KEY) return null;

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "Ocp-Apim-Subscription-Key": PIXAZO_API_KEY,
  };

  try {
    const response = await fetch(PIXAZO_GENERATE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(120000),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      failures.push(providerFailure("pixazo", response.status));
      logger.error("Pixazo Flux Schnell generation failed:", payload?.error?.message || payload?.error || response.statusText);
      return null;
    }

    let mediaUrl = extractPixazoMediaUrl(payload);
    if (!mediaUrl) {
      const pollingUrl = typeof payload?.polling_url === "string"
        ? payload.polling_url
        : typeof payload?.request_id === "string"
          ? `https://gateway.pixazo.ai/v2/requests/status/${encodeURIComponent(payload.request_id)}`
          : "";

      if (pollingUrl) {
        let safePollingUrl: URL | null = null;
        try {
          const parsed = new URL(pollingUrl);
          if (parsed.protocol === "https:" && parsed.hostname === "gateway.pixazo.ai") safePollingUrl = parsed;
        } catch {}

        if (safePollingUrl) {
          for (let attempt = 0; attempt < 20; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const poll = await fetch(safePollingUrl, {
              headers: { "Ocp-Apim-Subscription-Key": PIXAZO_API_KEY },
              signal: AbortSignal.timeout(30000),
            });
            const pollPayload = await poll.json().catch(() => ({}));
            if (!poll.ok) {
              failures.push(providerFailure("pixazo", poll.status));
              logger.error("Pixazo image status check failed:", pollPayload?.error?.message || poll.statusText);
              break;
            }

            mediaUrl = extractPixazoMediaUrl(pollPayload);
            if (mediaUrl) break;

            const status = String(pollPayload?.status || "").toUpperCase();
            if (["FAILED", "ERROR", "CANCELLED"].includes(status)) {
              logger.error("Pixazo image generation ended without an image:", pollPayload?.error || status);
              break;
            }
          }
        }
      }
    }

    if (!mediaUrl) {
      failures.push("pixazo: no image URL was returned before polling ended");
      logger.error("Pixazo Flux Schnell returned no usable image URL.");
      return null;
    }

    const bytes = await downloadGeneratedImage(mediaUrl);
    if (!bytes) failures.push("pixazo: generated image could not be downloaded");
    return bytes ? { bytes, provider: "pixazo", model: PIXAZO_MODEL } : null;
  } catch (error) {
    failures.push("pixazo: connection failed or request timed out");
    logger.error("Pixazo Flux Schnell generation errored:", error);
    return null;
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const prompt = cleanText(body.prompt, 4000);
  const style = cleanText(body.style, 500);
  const workspaceId = cleanText(body.workspaceId, 160) || "public";
  const type = cleanText(body.type, 80) || "generated";
  const requestedSize = cleanText(body.size, 40);
  const size = ALLOWED_SIZES.has(requestedSize) ? requestedSize : "1536x1024";

  if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

  const finalPrompt = style
    ? `${prompt}\n\nVisual style requested by the user: ${style}. Follow the requested style while preserving the subject, language-specific text, cultural context, composition, and intent.`
    : prompt;

  const generation = await generateImage(finalPrompt, size);
  const generated = generation.image;
  if (!generated) {
    const pixazoConfigured = Boolean(PIXAZO_API_KEY);
    const openaiConfigured = Boolean(OPENAI_API_KEY);
    const geminiConfigured = Boolean(GEMINI_API_KEY);
    const noProviderConfigured = !pixazoConfigured && !openaiConfigured && !geminiConfigured;

    return NextResponse.json(
      {
        error: noProviderConfigured
          ? "Image generation is unavailable because no image provider is configured in production. Add PIXAZO_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY/GOOGLE_AI_API_KEY."
          : `Image generation failed. ${generation.failures.join("; ") || "No provider returned an image."}`,
        imageProviders: {
          pixazo: pixazoConfigured ? "configured" : "missing",
          openai: openaiConfigured ? "configured" : "missing",
          gemini: geminiConfigured ? "configured" : "missing",
        },
        attemptedProviders: generation.attemptedProviders,
        providerFailures: generation.failures,
      },
      { status: 502 }
    );
  }

  const format = imageFormat(generated.bytes);
  if (!format || generated.bytes.length > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "The image provider returned an unsupported or oversized image." }, { status: 502 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
  const safeWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120) || "public";
  const safeType = type.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60) || "generated";
  const path = `temp/${safeWorkspace}/ai/${safeType}/${crypto.randomUUID()}.${format.extension}`;

  await logUsage({ userId, action: "api.call", apiCalls: 1 });

  if (supabase) {
    const { error } = await supabase.storage
      .from("ai-assets")
      .upload(path, generated.bytes, { contentType: format.mime, upsert: false });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("ai-assets").getPublicUrl(path);
      return NextResponse.json({
        imageUrl: publicUrl,
        tempPath: path,
        provider: generated.provider,
        model: generated.model,
        size,
      });
    }

    logger.error("AI image upload failed; returning inline image instead:", error.message);
  }

  return NextResponse.json({
    imageUrl: `data:${format.mime};base64,${generated.bytes.toString("base64")}`,
    tempPath: path,
    provider: generated.provider,
    model: generated.model,
    size,
  });
}

async function generateImage(prompt: string, size: string): Promise<ImageGenerationResult> {
  const attemptedProviders: string[] = [];
  const failures: string[] = [];

  if (PIXAZO_API_KEY) {
    attemptedProviders.push("pixazo");
    const pixazo = await generateWithPixazo(prompt, failures);
    if (pixazo) return { image: pixazo, attemptedProviders, failures };
  }

  if (OPENAI_API_KEY) {
    attemptedProviders.push("openai");
    for (const model of OPENAI_IMAGE_MODELS) {
      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, prompt, n: 1, size, quality: "low" }),
          signal: AbortSignal.timeout(120000),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          failures.push(providerFailure("openai", response.status));
          logger.error(`OpenAI image model ${model} failed:`, data?.error?.message || response.statusText);
          continue;
        }

        const b64 = data?.data?.[0]?.b64_json;
        if (typeof b64 === "string" && b64) {
          return { image: { bytes: Buffer.from(b64, "base64"), provider: "openai", model }, attemptedProviders, failures };
        }

        const url = data?.data?.[0]?.url;
        if (typeof url === "string" && url) {
          const imageResponse = await fetch(url, { signal: AbortSignal.timeout(60000) });
          if (imageResponse.ok) {
            return { image: { bytes: Buffer.from(await imageResponse.arrayBuffer()), provider: "openai", model }, attemptedProviders, failures };
          }
        }

        failures.push("openai: no usable image was returned");
        logger.error(`OpenAI image model ${model} returned no usable image payload.`);
      } catch (error) {
        failures.push("openai: connection failed or request timed out");
        logger.error(`OpenAI image model ${model} errored:`, error);
      }
    }
  }

  if (GEMINI_API_KEY) {
    attemptedProviders.push("gemini");
    const model = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";
    const aspectRatio = geminiAspectRatio(size);

    const attempts = [
      {
        label: "v1-response-format",
        url: `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`,
        body: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseFormat: {
              image: aspectRatio ? { aspectRatio } : {},
            },
          },
        },
      },
      {
        label: "v1beta-response-modalities",
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        body: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"], ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}) },
        },
      },
    ];

    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify(attempt.body),
          signal: AbortSignal.timeout(120000),
        });

        if (!response.ok) {
          failures.push(providerFailure("gemini", response.status));
          logger.error(`Gemini image generation (${attempt.label}) failed:`, await response.text());
          continue;
        }

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (typeof part?.inlineData?.data === "string" && part.inlineData.data) {
            return {
              image: { bytes: Buffer.from(part.inlineData.data, "base64"), provider: "gemini", model },
              attemptedProviders, failures,
            };
          }
        }

        failures.push("gemini: no usable image was returned (the response may have been filtered)");
        logger.error(`Gemini image generation (${attempt.label}) returned no usable image payload.`);
      } catch (error) {
        failures.push("gemini: connection failed or request timed out");
        logger.error(`Gemini image generation (${attempt.label}) errored:`, error);
      }
    }
  }

  return { image: null, attemptedProviders, failures: [...new Set(failures)] };
}

// Report actionable categories without exposing provider bodies, credentials, or account details.
function providerFailure(provider: string, status: number): string {
  const reason = status === 401 ? "API credentials were rejected"
    : status === 403 ? "access to the image model was denied"
    : status === 402 ? "billing or credits are required"
    : status === 404 ? "image model or endpoint was not found"
    : status === 429 ? "rate limit or quota was reached"
    : status >= 500 ? "provider is temporarily unavailable"
    : "provider rejected the image request";
  return `${provider}: ${reason} (HTTP ${status})`;
}

function imageFormat(bytes: Buffer): { mime: string; extension: string } | null {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { mime: "image/png", extension: "png" };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { mime: "image/jpeg", extension: "jpg" };
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return { mime: "image/webp", extension: "webp" };
  return null;
}
