import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const BUCKET = "3d-assets";
// Only the shared folders in the existing public bucket are cataloged. This
// intentionally excludes user-specific uploads and temporary model files.
const PUBLIC_FOLDERS = ["3D module", "environments", "props", "characters"] as const;

export type WonderPlayLibraryModel = {
  id: string;
  name: string;
  path: string;
  category: string;
  url: string;
  thumbnail: string | null;
  format: "glb" | "ply" | "sog";
};

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request).catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Sign in to view saved 3D models." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !secret) {
    return NextResponse.json({ error: "3D asset storage is not configured." }, { status: 503 });
  }

  try {
    // Supabase public file URLs do not imply Storage LIST privileges. Keep the
    // service credential exclusively server-side behind verified user auth.
    const storage = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).storage;
    const bucket = await storage.getBucket(BUCKET);
    if (bucket.error || bucket.data?.public !== true) {
      return NextResponse.json({ error: "Shared 3D library is unavailable." }, { status: 503 });
    }

    const results = await Promise.all(PUBLIC_FOLDERS.map(async (folder) => {
      const { data, error } = await storage.from(BUCKET).list(folder, {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        logger.warn("WonderPlay shared folder unavailable", { folder, message: error.message });
        throw new Error(`Could not list ${folder}`);
      }
      const files = data ?? [];
      const names = new Set(files.map((file) => file.name));
      return files.filter((file) => file.id && /\.(glb|ply|sog)$/i.test(file.name)).map((file): WonderPlayLibraryModel => {
        const path = `${folder}/${file.name}`;
        const imageName = file.name.replace(/\.(glb|ply|sog)$/i, ".png");
        return {
          id: `storage:${path}`,
          name: file.name.replace(/\.(glb|ply|sog)$/i, "").replace(/[_-]+/g, " "),
          path,
          category: folder,
          format: file.name.split(".").pop()!.toLowerCase() as WonderPlayLibraryModel["format"],
          url: storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
          thumbnail: names.has(imageName)
            ? storage.from(BUCKET).getPublicUrl(`${folder}/${imageName}`).data.publicUrl
            : null,
        };
      });
    }));

    return NextResponse.json({ assets: results.flat() }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logger.error("Failed to list WonderPlay shared assets", error);
    return NextResponse.json({ error: "Saved 3D assets could not be listed." }, { status: 502 });
  }
}
