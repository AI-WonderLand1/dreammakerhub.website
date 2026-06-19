import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RATE_LIMIT_WINDOW = 60 * 1000;
const rateLimits = new Map<string, { count: number; resetTime: number }>();

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

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const protectedPaths = [
    "/wonder-build",
    "/wonder-projects",
    "/wonderspace",
    "/dashboard",
    "/builder",
    "/playcanvas",
    "/editor",
    "/library",
    "/scene-library",
    "/marketplace",
    "/projects",
    "/agent-playground",
    "/settings",
    "/checkout",
    "/subscription",
    "/ide",
  ];

  const needsAuth = protectedPaths.some((p) => path.startsWith(p));

  if (needsAuth) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            req.cookies.set(name, value);
          }
          const response = NextResponse.next();
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    let isAuthenticated = false;
    try {
      const { data } = await supabase.auth.getSession();
      isAuthenticated = !!data?.session;
    } catch {
      isAuthenticated = false;
    }

    if (!isAuthenticated) {
      const loginUrl = new URL("/public-pages/auth", req.url);
      loginUrl.searchParams.set("redirectTo", path);
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
