import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";



interface DistributedRateLimitResult {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_WINDOW = 60 * 1000;
const REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const rateLimits = new Map<string, { count: number; resetTime: number }>();

async function incrementDistributedRateLimit(key: string): Promise<DistributedRateLimitResult | null> {
  if (!REDIS_REST_URL || !REDIS_REST_TOKEN) {
    return null;
  }

  const base = REDIS_REST_URL.replace(/\/$/, "");
  const headers = {
    Authorization: `Bearer ${REDIS_REST_TOKEN}`,
  };

  const incrRes = await fetch(`${base}/incr/${encodeURIComponent(key)}`, {
    method: "POST",
    headers,
    cache: "no-store",
  }).catch(() => null);

  if (!incrRes?.ok) {
    return null;
  }

  const incrData = (await incrRes.json().catch(() => null)) as { result?: number } | null;
  const count = typeof incrData?.result === "number" ? incrData.result : null;
  if (count === null) {
    return null;
  }

  if (count === 1) {
    await fetch(`${base}/expire/${encodeURIComponent(key)}/${Math.ceil(RATE_LIMIT_WINDOW / 1000)}`, {
      method: "POST",
      headers,
      cache: "no-store",
    }).catch(() => null);
  }

  const ttlRes = await fetch(`${base}/pttl/${encodeURIComponent(key)}`, {
    method: "POST",
    headers,
    cache: "no-store",
  }).catch(() => null);

  const ttlData = ttlRes?.ok
    ? ((await ttlRes.json().catch(() => null)) as { result?: number } | null)
    : null;
  const ttl = typeof ttlData?.result === "number" && ttlData.result > 0 ? ttlData.result : RATE_LIMIT_WINDOW;

  return {
    count,
    resetTime: Date.now() + ttl,
  };
}

function buildRateLimitKey(req: NextRequest): string {
  return `rl:${getRateLimitMax(req.nextUrl.pathname)}:${getClientIdentifier(req)}`;
}
const RATE_LIMIT_MAX = {
  ai: 20,
  auth: 10,
  default: 100,
};

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.ip || "unknown";
  return ip;
}

function getRateLimitMax(path: string): number {
  if (path.startsWith("/api/ai") || path.startsWith("/api/wonder-build")) {
    return RATE_LIMIT_MAX.ai;
  }
  if (path.startsWith("/api/auth")) {
    return RATE_LIMIT_MAX.auth;
  }
  return RATE_LIMIT_MAX.default;
}

function normalizeHost(raw: string | null): string {
  if (!raw) return "";
  const value = raw.trim().toLowerCase();
  return value.includes(":") ? value.split(":")[0] : value;
}

function isLocalHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

async function resolveCustomDomain(req: NextRequest) {
  const host = normalizeHost(req.headers.get("host"));
  if (!host || isLocalHost(host)) {
    return null;
  }

  const lookupUrl = req.nextUrl.clone();
  lookupUrl.pathname = "/api/domains/resolve";
  lookupUrl.search = "";
  lookupUrl.searchParams.set("host", host);
  lookupUrl.searchParams.set("path", req.nextUrl.pathname);

  if (req.nextUrl.search) {
    lookupUrl.searchParams.set("query", req.nextUrl.search);
  }

  const response = await fetch(lookupUrl, {
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!data?.ok || typeof data.path !== "string") {
    return null;
  }

  const rewriteUrl = req.nextUrl.clone();
  rewriteUrl.pathname = data.path;
  return rewriteUrl;
}

function extractSupabaseAccessToken(cookieHeader: string): string | null {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex <= 0) continue;

    const name = part.slice(0, eqIndex);
    const value = part.slice(eqIndex + 1);

    if (!name.startsWith("sb-") || !name.endsWith("-auth-token")) continue;

    try {
      const decoded = decodeURIComponent(value);
      const parsed = JSON.parse(decoded);

      if (parsed && typeof parsed.access_token === "string" && parsed.access_token.length > 0) {
        return parsed.access_token;
      }
    } catch {
      // Ignore malformed cookie and continue searching.
    }
  }

  return null;
}

async function checkAuth(req: NextRequest): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return false;

    const accessToken = extractSupabaseAccessToken(cookieHeader);
    if (!accessToken) return false;

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;


  if (path.startsWith("/admin")) {
    const isAuthenticated = await checkAuth(req);
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (!path.startsWith("/api/")) {
    const rewriteUrl = await resolveCustomDomain(req);
    if (rewriteUrl) {
      return NextResponse.rewrite(rewriteUrl);
    }
    return NextResponse.next();
  }

  const clientId = getClientIdentifier(req);
  const now = Date.now();
  const limit = getRateLimitMax(path);

  const entry = rateLimits.get(clientId);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return NextResponse.next();
  }

  if (entry.count >= limit) {
    return NextResponse.json(
      { error: "Too many requests", message: "Rate limit exceeded. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((entry.resetTime - now) / 1000)) } }
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*", "/admin/:path*"],
};