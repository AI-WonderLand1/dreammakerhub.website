import { NextResponse } from "next/server"
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

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

  const image = await generateImage(prompt)

  if (!image) {
    return NextResponse.json(
      { error: "Image generation failed. Check that GEMINI_API_KEY or OPENAI_API_KEY is set." },
      { status: 500 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

  const path = `temp/${workspaceId || "public"}/ai/${type || "generated"}/${crypto.randomUUID()}.png`

  if (supabase) {
    const { error } = await supabase.storage
      .from("ai-assets")
      .upload(path, image, { contentType: "image/png", upsert: false });

    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from("ai-assets").getPublicUrl(path);

    return NextResponse.json({
      imageUrl: publicUrl,
      tempPath: path,
    });
  }

  return NextResponse.json({
    imageUrl: `data:image/png;base64,${image.toString("base64")}`,
    tempPath: path,
  });
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
          }),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json;
      if (b64) return Buffer.from(b64, "base64");

      const url = data.data?.[0]?.url;
      if (url) {
        const imgResp = await fetch(url);
        return Buffer.from(await imgResp.arrayBuffer());
      }

      return null;
    } catch {
      return null;
    }
  }

  if (GEMINI_API_KEY) {
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

      if (!response.ok) return null

      const data = await response.json()
      const parts = data.candidates?.[0]?.content?.parts || []

      for (const part of parts) {
        if (part.inlineData) {
          return Buffer.from(part.inlineData.data, "base64")
        }
      }

      return null
    } catch {
      return null
    }
  }

  return null
}
