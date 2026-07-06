
import { type NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://my-app.com",
  "https://www.my-app.com",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins.join(", "),
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    if (allowedOrigins.includes(origin)) {
      return new NextResponse(null, { headers: corsHeaders });
    } else {
      return new NextResponse(null, { status: 403, statusText: "Forbidden" });
    }
  }

  // Handle actual requests
  const response = NextResponse.next();

  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  // Add other CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
