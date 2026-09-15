import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUserId } from "@/lib/auth";

const ALLOWED_BUCKETS = new Set(["projects", "splat-sources"]);

function normalizeUserScopedPath(rawPath: unknown, userId: string): string | null {
  if (typeof rawPath !== "string") return userId;

  const segments = rawPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }

  if (segments.length === 0) return userId;

  if (segments[0] === userId) {
    return segments.join("/");
  }

  return [userId, ...segments].join("/");
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: "Storage not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const requestedBucket = "bucket" in body && typeof body.bucket === "string" ? body.bucket : "projects";
  if (!ALLOWED_BUCKETS.has(requestedBucket)) {
    return NextResponse.json({ ok: false, error: "Bucket is not allowed" }, { status: 403 });
  }

  const scopedPath = normalizeUserScopedPath("path" in body ? body.path : "", userId);
  if (!scopedPath) {
    return NextResponse.json({ ok: false, error: "Invalid storage path" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.storage
    .from(requestedBucket)
    .list(scopedPath, { limit: 1000 });

  if (error) {
    return NextResponse.json({ ok: false, error: "Storage recovery failed" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, files: data, bucket: requestedBucket, path: scopedPath },
    { headers: { "Cache-Control": "no-store" } },
  );
}
