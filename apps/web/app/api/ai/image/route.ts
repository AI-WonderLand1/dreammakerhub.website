import { NextResponse } from "next/server"
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const AI_PROVIDER = process.env.AI_PROVIDER || "opencode"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

async function requireAuth(req: Request): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) { token = authHeader.slice(7); }
  else if (cookieHeader) { const m = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/); if (m) { try { token = JSON.parse(decodeURIComponent(m[1])).access_token; } catch {} } }
  if (!token) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(req: Request) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, workspaceId, type } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
  }

  // Image generation not yet supported via OpenCode - coming soon
  if (!process.env.OPENCODE_API_KEY) {
    return NextResponse.json(
      { error: "Image generation is not yet available. Please use a different method." },
      { status: 501 }
    )
  }

  const image = await generateImage(prompt)

  if (!image) {
    return NextResponse.json(
      { error: "Image generation not yet available via OpenCode." },
      { status: 501 }
    )
  }

  const tempPath = `temp/${workspaceId}/ai/${type}/${crypto.randomUUID()}.png`

  await uploadToTemp(tempPath, image)

  return NextResponse.json({
    tempUrl: `/${tempPath}`,
    expiresIn: 3600
  })
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  if (AI_PROVIDER === "google" && !GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not configured for image generation")
    return null
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini image generation error:", response.status, errorText)
      return null
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      if (part.inlineData) {
        return Buffer.from(part.inlineData.data, "base64")
      }
    }

    console.error("No image data in Gemini response")
    return null
  } catch (err) {
    console.error("Image generation error:", err)
    return null
  }
}

async function uploadToTemp(path: string, data: Buffer) {
  console.log("UPLOAD TEMP:", path, `(${data.length} bytes)`)
}
