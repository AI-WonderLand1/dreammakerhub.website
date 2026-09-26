import { type NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000", "http://localhost:5000",
  "https://dreammakerhub.website", "https://www.dreammakerhub.website",
  "https://ai-wonderland.dreammakerhub.website", "https://playground.dreammakerhub.website",
];

const API_KEY_PROTECTED_PATHS = ["/api/webhooks/", "/api/n8n/"];

// Known model-calling endpoints that do NOT yet reserve usage atomically.
// Keep them off until each route receives its own quota and entitlement checks.
// This is a temporary backstop, not a substitute for a full endpoint and worker audit.
const UNMETERED_AI_PATHS = new Set([
  "/api/chat",
  "/api/build/stream",
  "/api/builder/generate",
  "/api/convai/chat",
  "/api/wonderspace/ai",
  "/api/npc",
  "/api/3d/generate-scene",
  "/api/game-builder/create",
]);

const BUILD_SHA = process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "unknown";

function isPathProtected(pathname: string): boolean {
  return API_KEY_PROTECTED_PATHS.some((prefix) => pathname.startsWith(prefix));
}

function isUnmeteredBillablePath(pathname: string): boolean {
  // Only the reviewed, reserve-before-provider sitewide route may run. Keep the global
  // pause if billing is disabled: a migration alone must not start spending.
  if (pathname === '/api/chat') {
    return process.env.BILLABLE_OPERATIONS_ENABLED !== 'true';
  }
  // The main /api/ai route has an atomic guard. Other /api/ai/* POST handlers do not yet.
  return UNMETERED_AI_PATHS.has(pathname) || pathname.startsWith('/api/ai/');
}

function addCorsHeaders(response: NextResponse, origin: string) {
  if (!allowedOrigins.includes(origin)) return;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
}

function addDocumentCacheHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-DreamMaker-Build", BUILD_SHA);
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const { pathname } = request.nextUrl;
  const isApiRequest = pathname.startsWith("/api/") || pathname === '/api/ai';

  if (isApiRequest) {
    if (request.method === "OPTIONS") {
      if (!allowedOrigins.includes(origin)) {
        return new NextResponse(null, { status: 403, statusText: "Forbidden" });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
        },
      });
    }

    if (!['GET', 'HEAD'].includes(request.method) && isUnmeteredBillablePath(pathname)) {
      return NextResponse.json(
        { error: 'This AI endpoint is paused until server-side usage limits are installed.', code: 'COST_GUARD' },
        { status: 503 },
      );
    }

    if (isPathProtected(pathname)) {
      const apiKey = request.headers.get("x-api-key");
      const expectedKey = process.env.N8N_API_KEY;
      if (expectedKey !== undefined && expectedKey !== null) {
        if (apiKey !== expectedKey) {
          return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
        }
      } else if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "API key not configured on server" }, { status: 500 });
      }
    }
    const apiResponse = NextResponse.next();
    addCorsHeaders(apiResponse, origin);
    return apiResponse;
  }

  const response = NextResponse.next();
  addDocumentCacheHeaders(response);
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
