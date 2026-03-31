import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";

type PatchAction = "disconnect" | "reconnect";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: "Connection id is required" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { action?: PatchAction };
  const action = body.action;

  if (!action || !["disconnect", "reconnect"].includes(action)) {
    return NextResponse.json({ error: "Action must be disconnect or reconnect" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const updatePayload =
    action === "disconnect"
      ? {
          status: "disconnected",
          disconnected_at: now,
          updated_at: now,
        }
      : {
          status: "connected",
          disconnected_at: null,
          last_reconnected_at: now,
          connected_at: now,
          updated_at: now,
        };

  const { data, error } = await supabase
    .from("cloud_connections")
    .update(updatePayload)
    .eq("id", id)
    .select("id,status,connected_at,disconnected_at,last_reconnected_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ connection: data });
}
