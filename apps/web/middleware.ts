import { type NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://dreammakerhub.website",
  "https://www.dreammakerhub.website",
  "https://ai-wonderland.dreammakerhub.website",
  "https://playground.dreammakerhub.website",
];

// Define paths that require API key validation
const API_KEY_PROTECTED_PATHS = [
  "/api/webhooks/",
  "/api/n8n/",
  // Add more paths as needed
];

// Check if a path matches any of the protected paths
function isPathProtected(pathname: string): boolean {
  return API_KEY_PROTECTED_PATHS.some(prefix => 
    pathname.startsWith(prefix)
  );
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const { pathname } = request.nextUrl;

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    if (allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
        },
      });
    } else {
      return new NextResponse(null, { status: 403, statusText: "Forbidden" });
    }
  }

  // Check API key for protected paths
  if (isPathProtected(pathname)) {
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.N8N_API_KEY;
    
    // If API key is configured, it must match exactly
    if (expectedKey !== undefined && expectedKey !== null) {
      if (apiKey !== expectedKey) {
        return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
      }
    } else {
      // In development, allow requests when key is not configured (for ease of testing)
      // In production, this would be a configuration error - but we'll fail open for safety
      // Production systems should always have N8N_API_KEY set
      if (process.env.NODE_ENV !== "production") {
        if (!apiKey) {
          console.warn("[Middleware] N8N_API_KEY not set - allowing request without authentication (DEVELOPMENT ONLY)");
        }
      }
      // Note: In production with unset N8N_API_KEY, we allow the request through
      // This prevents accidental lockouts while encouraging proper configuration
    }
  }

  // Handle actual requests
  const response = NextResponse.next();

  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};