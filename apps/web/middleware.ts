import { type NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://dreammakerhub.website",
  "https://www.dreammakerhub.website",
  "https://ai-wonderland.dreammakerhub.website",
  "https://playground.dreammakerhub.website",
];

const API_KEY_PROTECTED_PATHS = [
  "/api/webhooks/",
  "/api/n8n/",
];

const BUILD_SHA =
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  "unknown";

function isPathProtected(pathname: string): boolean {
  return API_KEY_PROTECTED_PATHS.some((prefix) => pathname.startsWith(prefix));
}

function addCorsHeaders(response: NextResponse, origin: string) {
  if (!allowedOrigins.includes(origin)) return;

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
}

function addDocumentCacheHeaders(response: NextResponse) {
  // HTML/RSC documents must not outlive the Next.js build that generated their
  // hashed CSS/JS references. Hashed /_next/static assets are deliberately
  // excluded by the matcher below and retain their normal immutable caching.
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-DreamMaker-Build", BUILD_SHA);
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const { pathname } = request.nextUrl;
  const isApiRequest = pathname.startsWith("/api/");

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

    if (isPathProtected(pathname)) {
      const apiKey = request.headers.get("x-api-key");
      const expectedKey = process.env.N8N_API_KEY;

      if (expectedKey !== undefined && expectedKey !== null) {
        if (apiKey !== expectedKey) {
          return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
        }
      } else if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "API key not configured on server" },
          { status: 500 },
        );
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
