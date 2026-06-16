import { NextRequest, NextResponse } from "next/server";
<<<<<<< HEAD

export const runtime = "nodejs";

const SPIRIT_GUIDE_SYSTEM = `You are the Spirit Guide - a helpful AI assistant for the Wonderland 3D platform.

You help users with:
1. Answering questions about the platform, features, and how to use it
2. Creating 3D scenes when users describe what they want
3. Guiding users to the right tools

Available tools:
- Create with AI: /game-builder/create (describe a scene to AI)
- Scene Library: /library (browse pre-made scenes + blank canvas)
- WebGL Studio Editor: /wonder-build/playcanvas (edit scenes, import files)
- Cloud Storage Settings: /settings/cloud-storage (connect your own storage)

Guidelines:
- Be helpful and conversational
- When users want to create a 3D scene, guide them to /game-builder/create
- When users want to browse templates, guide them to /library  
- When users want to edit a scene or import files, guide them to /wonder-build/playcanvas
- When users want to connect their own storage, guide them to /settings/cloud-storage
- Keep responses concise but informative`;

async function callGithubAI(system: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GITHUB_MODELS_API_KEY;
  if (!apiKey) {
    throw new Error("GITHUB_MODELS_API_KEY is not configured. Please add it to your .env file.");
  }

  try {
    const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GitHub Models API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    throw error;
  }
}
=======
import { runModel } from "@core/ai/runModel";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { decryptSecret } from "@/lib/crypto/secrets";

export const runtime = "nodejs";

const SPIRIT_GUIDE_SYSTEM = `You are the Spirit Guide of AI Wonderland — a wise, creative, and inspiring AI companion.
You help users build websites, 3D scenes, games, and creative projects using AI.
Be encouraging, concise, and visionary. Keep responses under 150 words unless the user asks you to build something.
When the user wants to create something, describe what you'd build and suggest next steps.`;
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
<<<<<<< HEAD
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const conversationHistory = history?.slice(-10).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    })) || [];

    const createKeywords = ["create", "make", "build", "generate", "design", "3d", "scene", "game", "world"];
    const isCreateRequest = createKeywords.some(kw => message.toLowerCase().includes(kw));

    const fullPrompt = conversationHistory.length > 0
      ? `Previous conversation:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join("\n")}\n\nUser: ${message}`
      : message;

    try {
      const response = await callGithubAI(SPIRIT_GUIDE_SYSTEM, fullPrompt);

      return NextResponse.json({
        response: response.trim(),
        action: isCreateRequest ? "create_scene" : "answer"
      });
    } catch (error: any) {
      console.error("Spirit Guide AI error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to connect to AI service. Check GITHUB_MODELS_API_KEY configuration." },
        { status: 503 }
      );
    }

  } catch (error: any) {
    console.error("Spirit Guide error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get response" },
      { status: 500 }
    );
  }
}
=======
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
    let model = "groq/llama-3.1-8b-instant";

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
          console.error("Failed to decrypt API key:", e);
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
    });

    const response = result.text || "I sense great creativity in you. What would you like to build?";
    const createKeywords = ["create", "make", "build", "generate", "design", "3d", "scene", "game", "world"];
    const isCreateRequest = createKeywords.some(kw => message.toLowerCase().includes(kw));

    return NextResponse.json({ response, action: isCreateRequest ? "create_scene" : "answer" });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Spirit Guide error:", errMsg);
    return NextResponse.json(
      { error: errMsg || "Spirit Guide is resting. Try again shortly." },
      { status: 500 }
    );
  }
}
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
