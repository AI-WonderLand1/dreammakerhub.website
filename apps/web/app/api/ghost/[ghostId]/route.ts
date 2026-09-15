import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

const GHOST_PREFIX = "ghost";
const BUCKET = "temp_storage";
const GHOST_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function publicGhostShape(ghost: Record<string, unknown>) {
  return {
    id: ghost.id,
    name: ghost.name,
    description: ghost.description,
    files: ghost.files,
    createdAt: ghost.createdAt,
  };
}

// GET /api/ghost/[ghostId]
// Ghost snapshots currently live under a per-user storage prefix. Until a
// dedicated share-token/index table exists, fail closed and allow only the
// authenticated owner to read a snapshot. Never enumerate other users' roots.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ghostId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ghostId } = await params;
  if (!GHOST_ID_RE.test(ghostId || "")) {
    return NextResponse.json({ error: "Invalid ghostId" }, { status: 400 });
  }

  const path = `${user.id}/${GHOST_PREFIX}/${ghostId}.json`;
  const { data: blob, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !blob) {
    return NextResponse.json({ error: "Ghost not found" }, { status: 404 });
  }

  try {
    const text = await blob.text();
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed.createdBy !== user.id || parsed.id !== ghostId) {
      return NextResponse.json({ error: "Ghost not found" }, { status: 404 });
    }
    return NextResponse.json(publicGhostShape(parsed), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Ghost data is invalid" }, { status: 500 });
  }
}

// DELETE /api/ghost/[ghostId] - Delete an owned ghost link
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ghostId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ghostId } = await params;
  if (!GHOST_ID_RE.test(ghostId || "")) {
    return NextResponse.json({ error: "Invalid ghostId" }, { status: 400 });
  }

  const path = `${user.id}/${GHOST_PREFIX}/${ghostId}.json`;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ error: "Failed to delete ghost" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true }, {
    headers: { "Cache-Control": "no-store" },
  });
}
