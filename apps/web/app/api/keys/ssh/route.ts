import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@lib/supabase/server-client";

/**
 * API: /api/keys/ssh
 * Handles user SSH key management
 * Methods:
 *  - GET: List SSH keys
 *  - POST: Add a new SSH key
 *  - DELETE: Remove a key by ID
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
    .from("ssh_keys")
    .select("*")
    .eq("user_id", session.user.id);

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

  const { name, key } = await req.json();

  if (!name || !key) {
    return NextResponse.json(
      { error: "Missing name or key field" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.from("ssh_keys").insert([
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

  return NextResponse.json({ success: true, data });
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
    .from("ssh_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
