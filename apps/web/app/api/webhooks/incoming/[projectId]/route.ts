import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import crypto from "crypto";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

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

    // Get API key from header
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "") || req.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing API key. Use Authorization: Bearer <key> or X-Api-Key header.", traceId },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verify API key (hashed comparison)
    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const { data: config, error: configError } = await supabase
      .from("project_api_configs")
      .select("user_id, webhook_secret")
      .eq("project_id", projectId)
      .eq("api_key_hash", apiKeyHash)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key", traceId },
        { status: 401 }
      );
    }

    // Optionally verify HMAC signature
    const signature = req.headers.get("x-webhook-signature");
    if (signature && config.webhook_secret) {
      const body = await req.text();
      const expectedSig = crypto
        .createHmac("sha256", config.webhook_secret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSig) {
        return NextResponse.json(
          { ok: false, error: "Invalid signature", traceId },
          { status: 401 }
        );
      }
    }

    // Parse the incoming payload
    const payload = await req.json().catch(() => ({}));

    // Store the event
    const { error: eventError } = await supabase.from("project_webhook_events").insert({
      project_id: projectId,
      user_id: config.user_id,
      event_type: payload.event || "custom",
      payload: payload,
      received_at: new Date().toISOString(),
    });

    if (eventError) {
      logger.error("Failed to store webhook event:", eventError);
    }

    // Process event (extend as needed)
    const response: Record<string, unknown> = {
      ok: true,
      projectId,
      event: payload.event || "custom",
      traceId,
      receivedAt: new Date().toISOString(),
    };

    // Add any custom processing logic here
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
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing API key", traceId },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { projectId } = params;

    // Verify API key (hashed comparison)
    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const { data: config } = await supabase
      .from("project_api_configs")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("api_key_hash", apiKeyHash)
      .single();

    if (!config) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key", traceId },
        { status: 401 }
      );
    }

    // Get recent events
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
