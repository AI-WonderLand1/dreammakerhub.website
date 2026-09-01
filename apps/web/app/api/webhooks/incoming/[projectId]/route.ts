import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import crypto from "crypto";
import { logger } from '@/lib/logger';
import { verifyApiKeyHash } from '@/lib/security/api-key-hash.server';

export const runtime = "nodejs";

function verifyHexSignature(provided: string, expectedHex: string): boolean {
  const normalized = provided.startsWith('sha256=') ? provided.slice(7) : provided;
  if (!/^[0-9a-f]{64}$/i.test(normalized)) return false;

  const actual = Buffer.from(normalized, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function upgradeLegacyApiKeyHash(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  currentHash: string,
  upgradedHash?: string,
) {
  if (!upgradedHash) return;

  const { error } = await supabase
    .from("project_api_configs")
    .update({ api_key_hash: upgradedHash })
    .eq("project_id", projectId)
    .eq("api_key_hash", currentHash);

  if (error) {
    logger.warn("Failed to upgrade legacy project API key hash", {
      projectId,
      error,
    });
  }
}

/**
 * POST /api/webhooks/incoming/[projectId]
 * Receives incoming webhook calls for auto-generated project APIs.
 * Verifies the API key or HMAC signature, then stores/processes the event.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const traceId = randomUUID();

  try {
    const { projectId } = params;

    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : req.headers.get("x-api-key")?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing API key. Use Authorization: Bearer <key> or X-Api-Key header.", traceId },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: config, error: configError } = await supabase
      .from("project_api_configs")
      .select("user_id, webhook_secret, api_key_hash")
      .eq("project_id", projectId)
      .single();

    if (configError || !config?.api_key_hash) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key", traceId },
        { status: 401 }
      );
    }

    const keyVerification = await verifyApiKeyHash(apiKey, config.api_key_hash);
    if (!keyVerification.valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key", traceId },
        { status: 401 }
      );
    }

    await upgradeLegacyApiKeyHash(
      supabase,
      projectId,
      config.api_key_hash,
      keyVerification.upgradedHash,
    );

    // Read the body exactly once so HMAC verification and JSON parsing use
    // identical bytes.
    const rawBody = await req.text();

    const signature = req.headers.get("x-webhook-signature");
    if (signature && config.webhook_secret) {
      const expectedSig = crypto
        .createHmac("sha256", config.webhook_secret)
        .update(rawBody)
        .digest("hex");

      if (!verifyHexSignature(signature, expectedSig)) {
        return NextResponse.json(
          { ok: false, error: "Invalid signature", traceId },
          { status: 401 }
        );
      }
    }

    let payload: Record<string, any> = {};
    if (rawBody.trim()) {
      try {
        const parsed = JSON.parse(rawBody);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          payload = parsed;
        } else {
          return NextResponse.json(
            { ok: false, error: "Webhook payload must be a JSON object", traceId },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { ok: false, error: "Invalid JSON payload", traceId },
          { status: 400 }
        );
      }
    }

    const { error: eventError } = await supabase.from("project_webhook_events").insert({
      project_id: projectId,
      user_id: config.user_id,
      event_type: payload.event || "custom",
      payload,
      received_at: new Date().toISOString(),
    });

    if (eventError) {
      logger.error("Failed to store webhook event:", eventError);
    }

    const response: Record<string, unknown> = {
      ok: true,
      projectId,
      event: payload.event || "custom",
      traceId,
      receivedAt: new Date().toISOString(),
    };

    if (payload.event === "build.complete") {
      response.action = "Project build completed";
      response.deploymentUrl = `/published/${projectId}`;
    }

    if (payload.event === "ai.generated") {
      response.action = "AI generation received";
      response.model = payload.model || "unknown";
    }

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Webhook processing failed", traceId },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/incoming/[projectId]
 * Returns recent webhook events for a project.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const traceId = randomUUID();

  try {
    const apiKey = req.headers.get("x-api-key")?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing API key", traceId },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { projectId } = params;

    const { data: config, error: configError } = await supabase
      .from("project_api_configs")
      .select("user_id, api_key_hash")
      .eq("project_id", projectId)
      .single();

    if (configError || !config?.api_key_hash) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key", traceId },
        { status: 401 }
      );
    }

    const keyVerification = await verifyApiKeyHash(apiKey, config.api_key_hash);
    if (!keyVerification.valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key", traceId },
        { status: 401 }
      );
    }

    await upgradeLegacyApiKeyHash(
      supabase,
      projectId,
      config.api_key_hash,
      keyVerification.upgradedHash,
    );

    const { data: events, error } = await supabase
      .from("project_webhook_events")
      .select("id, event_type, payload, received_at")
      .eq("project_id", projectId)
      .order("received_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, traceId },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      projectId,
      events: events || [],
      traceId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Failed to fetch events", traceId },
      { status: 500 }
    );
  }
}
