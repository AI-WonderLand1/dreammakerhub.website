
import { type NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://my-app.com",
  "https://www.my-app.com",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    if (allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    } else {
      return new NextResponse(null, { status: 403, statusText: "Forbidden" });
    }
  }

  // Handle actual requests
  const response = NextResponse.next();

  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
