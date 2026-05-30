import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

const GHOST_PREFIX = "ghost";
const BUCKET = "temp_storage";

// GET /api/ghost/[ghostId] - Download a ghost snapshot (public if shared)
export async function GET(
  req: NextRequest,
  { params }: { params: { ghostId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ghostId = params.ghostId;
  if (!ghostId) {
    return NextResponse.json({ error: "ghostId required" }, { status: 400 });
  }

  // Try to find the ghost file across all users' ghost directories
  // First try the current user's directory if logged in
  if (user) {
    const path = `${user.id}/${GHOST_PREFIX}/${ghostId}.json`;
    const { data: blob } = await supabase.storage.from(BUCKET).download(path);
    if (blob) {
      const text = await blob.text();
      const ghost = JSON.parse(text);
      return NextResponse.json({
        id: ghost.id,
        name: ghost.name,
        description: ghost.description,
        files: ghost.files,
        createdAt: ghost.createdAt,
      });
    }
  }

  // Search across all users (for shared ghost links)
  const { data: userDirs } = await supabase.storage.from(BUCKET).list("", { limit: 1000 });
  if (userDirs) {
    for (const dir of userDirs) {
      if (!dir.name) continue;
      const ghostPath = `${dir.name}/${GHOST_PREFIX}/${ghostId}.json`;
      try {
        const { data: blob } = await supabase.storage.from(BUCKET).download(ghostPath);
        if (blob) {
          const text = await blob.text();
          const ghost = JSON.parse(text);
          return NextResponse.json({
            id: ghost.id,
            name: ghost.name,
            description: ghost.description,
            files: ghost.files,
            createdAt: ghost.createdAt,
          });
        }
      } catch {
        // continue searching
      }
    }
  }

  return NextResponse.json({ error: "Ghost not found" }, { status: 404 });
}

// DELETE /api/ghost/[ghostId] - Delete a ghost link
export async function DELETE(
  req: NextRequest,
  { params }: { params: { ghostId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ghostId = params.ghostId;
  const path = `${user.id}/${GHOST_PREFIX}/${ghostId}.json`;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ error: "Failed to delete ghost" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
