import { NextRequest, NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { encryptSecret } from "@/lib/crypto/secrets";
import { logger } from '@/lib/logger';

interface AIProviderConfig {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export async function GET(req: NextRequest) {
  const supabase = await supabaseRouteClient();
  
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: configs, error } = await supabase
      .from("ai_provider_configs")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const parsedConfigs: Record<string, AIProviderConfig> = {};
    let activeProvider = "opencode";

    for (const row of configs || []) {
      parsedConfigs[row.provider] = {
        provider: row.provider,
        model: row.default_model,
        baseUrl: row.base_url || undefined,
      };
      if (row.is_active) {
        activeProvider = row.provider;
      }
    }

    return NextResponse.json({ configs: parsedConfigs, activeProvider });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const supabase = await supabaseRouteClient();
  
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { configs, activeProvider } = await req.json();

  if (!configs || typeof configs !== "object") {
    return NextResponse.json({ error: "Invalid config format" }, { status: 400 });
  }

  try {
    for (const [providerId, config] of Object.entries(configs as Record<string, AIProviderConfig>)) {
      const configData = config as AIProviderConfig;
      const encrypted = configData.apiKey ? encryptSecret(configData.apiKey) : null;

      const { error } = await supabase
        .from("ai_provider_configs")
        .upsert({
          user_id: user.id,
          provider: providerId,
          api_key_encrypted: encrypted?.secret_ciphertext || null,
          api_key_iv: encrypted?.secret_iv || null,
          api_key_tag: encrypted?.secret_tag || null,
          api_key_alg: encrypted?.secret_alg || null,
          default_model: configData.model,
          base_url: configData.baseUrl,
          is_active: providerId === activeProvider,
        }, {
          onConflict: "user_id,provider",
        });

      if (error) {
        const err = error as { message?: string };
        return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}