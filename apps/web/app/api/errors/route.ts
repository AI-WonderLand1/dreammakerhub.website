import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUserId } from "@/lib/auth";
import { logger } from '@/lib/logger';

const MAX_BODY_BYTES = 64 * 1024;
const WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  return current.count > MAX_REPORTS_PER_WINDOW;
}

function sameSiteRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set([
    process.env.NEXT_PUBLIC_URL,
    "https://dreammakerhub.website",
    "https://www.dreammakerhub.website",
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
    process.env.NODE_ENV !== "production" ? "http://localhost:5000" : undefined,
  ].filter((value): value is string => Boolean(value)));

  try {
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

function safeString(value: unknown, max: number): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}

export async function POST(req: NextRequest) {
  try {
    if (!sameSiteRequest(req)) {
      return NextResponse.json({ success: true });
    }

    const length = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false }, { status: 413 });
    }

    if (rateLimited(clientKey(req))) {
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const authenticatedUserId = await requireUserId(req);
    const errorEntry = {
      message: safeString(body.message, 1000) || "Unknown error",
      stack: safeString(body.stack, 2000),
      url: safeString(body.url, 2000),
      user_agent: safeString(body.userAgent, 512) || safeString(req.headers.get("user-agent"), 512),
      // Never trust a browser-supplied userId for audit/log attribution.
      user_id: authenticatedUserId,
      created_at: new Date().toISOString(),
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await supabase.from("client_error_logs").insert(errorEntry);
      if (error) {
        logger.error("Failed to log client error", { message: error.message });
      }
    }

    logger.error("[CLIENT ERROR]", errorEntry);
    return NextResponse.json({ success: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    logger.error("Error logging endpoint:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
