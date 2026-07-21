import { NextRequest, NextResponse } from "next/server";
import { runModel } from "@/core/ai/runModel";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { decryptSecret } from "@/lib/crypto/secrets";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const SPIRIT_GUIDE_SYSTEM = `You are the Spirit Guide of AI Wonderland — a wise, creative, and inspiring AI companion.
You help users build websites, 3D scenes, games, and creative projects using AI.
Be encouraging, concise, and visionary. Keep responses under 150 words unless the user asks you to build something.
When the user wants to create something, describe what you'd build and suggest next steps.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (history?.length > 0) {
      for (const m of history.slice(-8)) {
        messages.push({ role: m.role, content: m.content });
      }
    }
    messages.push({ role: "user", content: message });

    const supabase = await supabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userApiKey: string | undefined;
    let model = "openrouter/google/gemini-flash-1.5";

    if (user) {
      const { data: config } = await supabase
        .from("ai_provider_configs")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (config?.api_key_encrypted && config?.api_key_iv && config?.api_key_tag) {
        try {
          userApiKey = decryptSecret(config.api_key_encrypted, config.api_key_iv, config.api_key_tag);
        } catch (e) {
          logger.error("Failed to decrypt API key:", e);
        }
      }

      if (config?.default_model) {
        model = config.default_model;
        if (!model.includes("/")) {
          model = `${config.provider}/${model}`;
        }
      }
    }

    const result = await runModel({
      model,
      messages,
      system: SPIRIT_GUIDE_SYSTEM,
      temperature: 0.8,
      maxTokens: 512,
      userApiKey,
      baseUrl: config?.base_url || undefined,
    });

    if (result.error) {
      const detail = result.confessions?.limitations?.[0];
      logger.error("[Spirit Guide] AI provider error:", {
        provider: result.provider,
        model: result.model,
        detail,
      });
      return NextResponse.json({
        response: result.text || "The Spirit Guide is unavailable right now.",
        error: true,
        detail,
      });
    }

    const response = result.text || "I sense great creativity in you. What would you like to build?";
    const createKeywords = ["create", "make", "build", "generate", "design", "3d", "scene", "game", "world"];
    const isCreateRequest = createKeywords.some(kw => message.toLowerCase().includes(kw));

    return NextResponse.json({ response, action: isCreateRequest ? "create_scene" : "answer" });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    logger.error("Spirit Guide error:", errMsg);
    return NextResponse.json(
      { error: errMsg || "Spirit Guide is resting. Try again shortly." },
      { status: 500 }
    );
  }
}
