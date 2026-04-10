import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 1000;
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

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (!path.startsWith("/api/")) {
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
  matcher: "/api/:path*",
};
