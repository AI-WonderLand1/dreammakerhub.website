import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { requireUserId } from "@/lib/auth";
import { logUsage } from "@/lib/usage/log";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-2.5-sunburst";
const OPENAI_IMAGE_MODELS = [
  process.env.OPENAI_IMAGE_MODEL?.trim(),
  DEFAULT_OPENAI_IMAGE_MODEL,
  "gpt-image-2",
].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);

const ALLOWED_SIZES = new Set(["auto", "1024x1024", "1536x1024", "1024x1536"]);

type GeneratedImage = {
  bytes: Buffer;
  provider: string;
  model: string;
};

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, maxLength) : "";
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

  const generated = await generateImage(finalPrompt, size);
  if (!generated) {
    return NextResponse.json(
      { error: "Image generation failed. Configure a valid OPENAI_API_KEY or GEMINI_API_KEY/GOOGLE_AI_API_KEY with image access." },
      { status: 502 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
  const safeWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120) || "public";
  const safeType = type.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60) || "generated";
  const path = `temp/${safeWorkspace}/ai/${safeType}/${crypto.randomUUID()}.png`;

  await logUsage({ userId, action: "api.call", apiCalls: 1 });

  if (supabase) {
    const { error } = await supabase.storage
      .from("ai-assets")
      .upload(path, generated.bytes, { contentType: "image/png", upsert: false });

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
    imageUrl: `data:image/png;base64,${generated.bytes.toString("base64")}`,
    tempPath: path,
    provider: generated.provider,
    model: generated.model,
    size,
  });
}

async function generateImage(prompt: string, size: string): Promise<GeneratedImage | null> {
  if (OPENAI_API_KEY) {
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
          logger.error(`OpenAI image model ${model} failed:`, data?.error?.message || response.statusText);
          continue;
        }

        const b64 = data?.data?.[0]?.b64_json;
        if (typeof b64 === "string" && b64) {
          return { bytes: Buffer.from(b64, "base64"), provider: "openai", model };
        }

        const url = data?.data?.[0]?.url;
        if (typeof url === "string" && url) {
          const imageResponse = await fetch(url, { signal: AbortSignal.timeout(60000) });
          if (imageResponse.ok) {
            return { bytes: Buffer.from(await imageResponse.arrayBuffer()), provider: "openai", model };
          }
        }
      } catch (error) {
        logger.error(`OpenAI image model ${model} errored:`, error);
      }
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
          signal: AbortSignal.timeout(120000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (typeof part?.inlineData?.data === "string") {
            return { bytes: Buffer.from(part.inlineData.data, "base64"), provider: "gemini", model };
          }
        }
      } else {
        logger.error("Gemini image generation failed:", await response.text());
      }
    } catch (error) {
      logger.error("Gemini image generation errored:", error);
    }
  }

  return null;
}
