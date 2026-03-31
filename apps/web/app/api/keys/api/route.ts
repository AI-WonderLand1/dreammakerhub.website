import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@lib/supabase/server-client";

/**
 * API: /api/keys/api
 * Manages user API keys.
 *
 * Methods:
 *  - GET: List API keys for logged-in user
 *  - POST: Create a new API key
 *  - DELETE: Revoke an API key by ID
 */

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, created_at, last_used_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Missing key name" },
      { status: 400 }
    );
  }

  // Generate secure 40-character API key
  const key = crypto.randomBytes(20).toString("hex");

  const { data, error } = await supabase.from("api_keys").insert([
    {
      user_id: session.user.id,
      name,
      key,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    key, // return once (user should copy it)
    data,
  });
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing key ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
