import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { listFiles, readFile } from "@/lib/projects/storage";
import { randomUUID } from "crypto";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const GHOST_PREFIX = "ghost";
const BUCKET = "temp_storage";

// POST /api/ghost - Create a ghost link from a project
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, name, description } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    // Read all project files from Postgres
    const fileList = await listFiles(projectId, user.id);
    if (!fileList || fileList.length === 0) {
      return NextResponse.json({ error: "No files in project" }, { status: 400 });
    }

    const files: Record<string, string> = {};
    for (const filePath of fileList) {
      const content = await readFile(projectId, user.id, filePath);
      if (content !== null) {
        files[filePath] = content;
      }
    }

    const ghostId = randomUUID();
    const ghostData = {
      id: ghostId,
      projectId,
      name: name || `Ghost ${ghostId.slice(0, 8)}`,
      description: description || "",
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      files,
    };

    // Store ghost snapshot
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(`${user.id}/${GHOST_PREFIX}/${ghostId}.json`, JSON.stringify(ghostData), {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Store ghost metadata in a lightweight list
    const metaEntry = {
      id: ghostId,
      name: ghostData.name,
      description: ghostData.description,
      projectId,
      createdAt: ghostData.createdAt,
      fileCount: Object.keys(files).length,
    };

    await supabase.storage
      .from(BUCKET)
      .upload(`${user.id}/${GHOST_PREFIX}/_index.json`, JSON.stringify(metaEntry), {
        contentType: "application/json",
        upsert: false, // don't overwrite — we append below
      }).catch(() => {});

    return NextResponse.json({
      ghostId,
      url: `/ghost/${ghostId}`,
      name: ghostData.name,
      createdAt: ghostData.createdAt,
      fileCount: Object.keys(files).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create ghost" }, { status: 500 });
  }
}

// GET /api/ghost - List user's ghost links
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefix = `${user.id}/${GHOST_PREFIX}/`;
    const { data: files } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100 });
    if (!files) return NextResponse.json({ ghosts: [] });

    const ghosts = [];
    for (const file of files) {
      if (file.name === "_index.json" || file.name.endsWith(".json")) {
        try {
          const { data: blob } = await supabase.storage.from(BUCKET).download(`${prefix}${file.name}`);
          if (blob) {
            const text = await blob.text();
            const parsed = JSON.parse(text);
            ghosts.push({
              id: parsed.id || file.name.replace(".json", ""),
              name: parsed.name || "Unnamed Ghost",
              description: parsed.description || "",
              createdAt: parsed.createdAt || file.created_at,
              fileCount: parsed.fileCount || Object.keys(parsed.files || {}).length,
            });
          }
        } catch {
          // skip invalid files
        }
      }
    }

    ghosts.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return NextResponse.json({ ghosts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list ghosts" }, { status: 500 });
  }
}
