import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@lib/supabase/server-client";

interface TTSRequest {
  text: string;
  voiceId?: string;
  apiKey?: string;
}

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TTSRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { text, voiceId, apiKey: userProvidedKey } = body;

  if (!text?.trim()) {
    return NextResponse.json(
      { error: "Missing required field: text" },
      { status: 400 }
    );
  }

  let apiKey = userProvidedKey;

  if (!apiKey) {
    try {
      const { data: keys } = await supabase
        .from("user_api_keys")
        .select("key")
        .eq("user_id", session.user.id)
        .eq("provider", "elevenlabs")
        .limit(1)
        .single();

      if (keys?.key) {
        apiKey = keys.key;
      }
    } catch (e) {
      // Table may not exist, continue to require key in request
    }
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key required. Pass apiKey in request body or store via GET /api/npc/tts?action=store&key=YOUR_KEY" },
      { status: 400 }
    );
  }

  const selectedVoiceId = voiceId || DEFAULT_VOICE_ID;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text.slice(0, 5000),
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return NextResponse.json(
        { error: "ElevenLabs API error", details: errorText },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      audio: `data:audio/mp3;base64,${audioBase64}`,
      duration: Math.round(audioBuffer.byteLength / 1000),
    });
  } catch (error) {
    console.error("Error calling ElevenLabs:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = searchParams.get("action");
  const storeKey = searchParams.get("key");

  if (action === "store" && storeKey) {
    const { error } = await supabase.from("user_api_keys").upsert(
      {
        user_id: session.user.id,
        provider: "elevenlabs",
        key: storeKey,
        name: "ElevenLabs API Key",
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "ElevenLabs API key stored" });
  }

  const { data: keys } = await supabase
    .from("user_api_keys")
    .select("id, provider, name, created_at")
    .eq("user_id", session.user.id)
    .eq("provider", "elevenlabs");

  return NextResponse.json({ stored: !!keys?.length });
}