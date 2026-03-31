import { NextRequest, NextResponse } from "next/server";
import { injectWiringRuntime } from "@/lib/wonder-build/wiringRuntime";

const BUCKET = "published";

function mimeType(file: string) {
  const f = file.toLowerCase();
  if (f.endsWith(".html")) return "text/html; charset=utf-8";
  if (f.endsWith(".css")) return "text/css; charset=utf-8";
  if (f.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (f.endsWith(".json")) return "application/json; charset=utf-8";
  if (f.endsWith(".png")) return "image/png";
  if (f.endsWith(".jpg") || f.endsWith(".jpeg")) return "image/jpeg";
  if (f.endsWith(".webp")) return "image/webp";
  if (f.endsWith(".svg")) return "image/svg+xml";
  if (f.endsWith(".mp4")) return "video/mp4";
  if (f.endsWith(".webm")) return "video/webm";
  if (f.endsWith(".ico")) return "image/x-icon";
  if (f.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

function safeRelPath(p: string) {
  const s = String(p || "").replace(/^\/+/, "");
  if (!s) return "index.html";
  if (s.includes("..")) throw new Error("bad path");
  if (s.includes("\\")) throw new Error("bad path");
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(s)) throw new Error("bad path");
  return s;
}

function publicObjectUrl(key: string) {
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  if (!base) throw new Error("Missing SUPABASE URL");

  // Supabase public bucket URL format:
  // {SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET}/${key}`;
}

function injectIfHtml(rel: string, bytes: Buffer) {
  if (!rel.toLowerCase().endsWith(".html")) return bytes;
  const html = bytes.toString("utf8");
  return Buffer.from(injectWiringRuntime(html), "utf8");
}

export const runtime = "nodejs";

async function fetchPublic(key: string) {
  const url = publicObjectUrl(key);
  const res = await fetch(url);
  if (!res.ok) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  return { bytes, url };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string; publishId: string; path?: string[] } }
) {
  try {
    const rel = safeRelPath(params.path?.join("/") || "index.html");
    const basePrefix = `${params.projectId}/${params.publishId}/`;

    // 1) direct file
    const directKey = basePrefix + rel;
    const direct = await fetchPublic(directKey);
    if (direct) {
      const body = injectIfHtml(rel, direct.bytes);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": mimeType(rel),
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Cache-Control": "public, max-age=31536000, immutable",
          // minimal CSP; you can tighten later
          "Content-Security-Policy": "default-src 'self' https: data: blob:; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
        },
      });
    }

    // 2) folder index fallback
    if (!rel.endsWith("index.html")) {
      const fallbackKey = basePrefix + `${rel}/index.html`;
      const fallback = await fetchPublic(fallbackKey);
      if (fallback) {
        const body = injectIfHtml("index.html", fallback.bytes);
        return new NextResponse(body, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Security-Policy": "default-src 'self' https: data: blob:; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
          },
        });
      }
    }

    // 3) root index fallback
    const rootKey = basePrefix + "index.html";
    const root = await fetchPublic(rootKey);
    if (root) {
      const body = injectIfHtml("index.html", root.bytes);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Security-Policy": "default-src 'self' https: data: blob:; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
        },
      });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
