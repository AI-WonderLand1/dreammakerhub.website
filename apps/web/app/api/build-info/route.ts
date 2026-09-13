import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const buildSha =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    "unknown";

  const provider = process.env.RAILWAY_ENVIRONMENT_ID
    ? "railway"
    : process.env.VERCEL
      ? "vercel"
      : "unknown";

  const response = NextResponse.json({
    buildSha,
    provider,
    service: process.env.RAILWAY_SERVICE_NAME || "unknown",
    environment: process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || "unknown",
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");

  return response;
}
