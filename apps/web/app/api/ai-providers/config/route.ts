import { NextRequest, NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { encryptSecret } from "@/lib/crypto/secrets";

interface AIProviderConfig {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

const PROVIDER_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_CONFIGS = 25;
const MAX_API_KEY_LENGTH = 16_384;
const MAX_MODEL_LENGTH = 256;
const MAX_BASE_URL_LENGTH = 2_048;

function isObviouslyPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "169.254.169.254" ||
    host === "metadata.google.internal"
  ) {
    return true;
  }

  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)) return true;
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) return true;

  return false;
}

function validateBaseUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > MAX_BASE_URL_LENGTH) {
    throw new Error("Invalid provider base URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Invalid provider base URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Provider base URL must use HTTPS");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Provider base URL must not contain credentials");
  }
  if (isObviouslyPrivateHost(parsed.hostname)) {
    throw new Error("Provider base URL must not target a private or metadata host");
  }

  return parsed.toString().replace(/\/$/, "");
}

function validateConfigMap(input: unknown): Record<string, AIProviderConfig> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid config format");
  }

  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length > MAX_CONFIGS) {
    throw new Error("Too many provider configurations");
  }

  const validated: Record<string, AIProviderConfig> = {};

  for (const [providerId, rawConfig] of entries) {
    if (!PROVIDER_ID_RE.test(providerId)) {
      throw new Error("Invalid provider identifier");
    }
    if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
      throw new Error(`Invalid configuration for ${providerId}`);
    }

    const config = rawConfig as AIProviderConfig;
    if (config.apiKey !== undefined && (typeof config.apiKey !== "string" || config.apiKey.length > MAX_API_KEY_LENGTH)) {
      throw new Error(`Invalid API key for ${providerId}`);
    }
    if (config.model !== undefined && (typeof config.model !== "string" || config.model.length > MAX_MODEL_LENGTH)) {
      throw new Error(`Invalid model for ${providerId}`);
    }

    validated[providerId] = {
      model: config.model?.trim() || undefined,
      apiKey: config.apiKey?.trim() || undefined,
      baseUrl: validateBaseUrl(config.baseUrl) || undefined,
    };
  }

  return validated;
}

export async function GET() {
  const supabase = await supabaseRouteClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: configs, error } = await supabase
      .from("ai_provider_configs")
      .select("provider, default_model, base_url, is_active")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to load provider configuration" }, { status: 500 });
    }

    const parsedConfigs: Record<string, AIProviderConfig> = {};
    let activeProvider = "opencode";

    for (const row of configs || []) {
      parsedConfigs[row.provider] = {
        provider: row.provider,
        model: row.default_model,
        baseUrl: row.base_url || undefined,
      };
      if (row.is_active) activeProvider = row.provider;
    }

    return NextResponse.json(
      { configs: parsedConfigs, activeProvider },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Failed to load provider configuration" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const supabase = await supabaseRouteClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let configs: Record<string, AIProviderConfig>;
  try {
    configs = validateConfigMap((body as Record<string, unknown>).configs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid provider configuration" },
      { status: 400 },
    );
  }

  const rawActiveProvider = (body as Record<string, unknown>).activeProvider;
  const activeProvider = typeof rawActiveProvider === "string" && PROVIDER_ID_RE.test(rawActiveProvider)
    ? rawActiveProvider
    : null;

  try {
    if (activeProvider) {
      const { error: deactivateError } = await supabase
        .from("ai_provider_configs")
        .update({ is_active: false })
        .eq("user_id", user.id);
      if (deactivateError) {
        return NextResponse.json({ error: "Failed to update active provider" }, { status: 500 });
      }
    }

    for (const [providerId, config] of Object.entries(configs)) {
      const updateData: Record<string, unknown> = {
        default_model: config.model || null,
        base_url: config.baseUrl || null,
        is_active: providerId === activeProvider,
      };

      if (config.apiKey) {
        const encrypted = encryptSecret(config.apiKey);
        updateData.api_key_encrypted = encrypted.secret_ciphertext;
        updateData.api_key_iv = encrypted.secret_iv;
        updateData.api_key_tag = encrypted.secret_tag;
        updateData.api_key_alg = encrypted.secret_alg;
      }

      const { data: existing, error: existingError } = await supabase
        .from("ai_provider_configs")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider", providerId)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json({ error: "Failed to inspect provider configuration" }, { status: 500 });
      }

      const result = existing
        ? await supabase
            .from("ai_provider_configs")
            .update(updateData)
            .eq("user_id", user.id)
            .eq("provider", providerId)
        : await supabase
            .from("ai_provider_configs")
            .insert({
              user_id: user.id,
              provider: providerId,
              ...updateData,
            });

      if (result.error) {
        return NextResponse.json({ error: "Failed to save provider configuration" }, { status: 500 });
      }
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Failed to save provider configuration" }, { status: 500 });
  }
}
