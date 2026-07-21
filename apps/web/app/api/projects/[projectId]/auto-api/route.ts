import { NextRequest, NextResponse } from "next/server";
import { randomUUID, randomBytes } from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@/lib/smokeAuth";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

/**
 * POST /api/projects/[projectId]/auto-api
 * Auto-generates an API key + webhook endpoint for a published project.
 * Returns the API key (shown once) and the webhook URL for receiving events.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const traceId = randomUUID();

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const smokeUserId = getSmokeUserIdFromRequest(req);
    const ownerId = smokeUserId ?? user?.id;

    if (!ownerId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", traceId },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Generate API key
    const apiKey = `dmh_${randomBytes(24).toString("hex")}`;

    // Generate webhook secret for signing
    const webhookSecret = randomBytes(32).toString("hex");

    // Store the auto-generated API config
    const { data, error } = await supabase
      .from("project_api_configs")
      .upsert(
        {
          project_id: projectId,
          user_id: ownerId,
          api_key: apiKey,
          webhook_secret: webhookSecret,
          webhook_url: `${req.nextUrl.origin}/api/webhooks/incoming/${projectId}`,
          created_at: new Date().toISOString(),
        },
        { onConflict: "project_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, traceId },
        { status: 500 }
      );
    }

    // Also create an API key entry in the user's keys
    const keyName = `Project: ${projectId}`;
    await supabase.from("api_keys").insert({
      user_id: ownerId,
      name: keyName,
      key: apiKey,
      project_id: projectId,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      apiKey,
      webhookUrl: data.webhook_url,
      webhookSecret,
      projectId,
      traceId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Auto-API generation failed", traceId },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[projectId]/auto-api
 * Retrieve existing API config for a project.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const traceId = randomUUID();

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const smokeUserId = getSmokeUserIdFromRequest(req);
    const ownerId = smokeUserId ?? user?.id;

    if (!ownerId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", traceId },
        { status: 401 }
      );
    }

    const { projectId } = params;

    const { data, error } = await supabase
      .from("project_api_configs")
      .select("project_id, webhook_url, created_at")
      .eq("project_id", projectId)
      .eq("user_id", ownerId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "No API config found. Generate one first.", traceId },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      projectId: data.project_id,
      webhookUrl: data.webhook_url,
      createdAt: data.created_at,
      traceId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Failed to fetch API config", traceId },
      { status: 500 }
    );
  }
}
