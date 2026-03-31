import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_ROOT = path.join(process.cwd(), ".data", "projects");
export const runtime = "nodejs";

// Simple in-memory cache to avoid re-scanning the filesystem on every request
type CacheValue = { pid: string; publishId: string; expiresAt: number };
const DOMAIN_CACHE = new Map<string, CacheValue>();
const CACHE_TTL_MS = 60_000; // 60s

function normalizeHost(raw: string) {
  const h = raw.trim().toLowerCase();
  // strip port if present (example.com:3000)
  return h.includes(":") ? h.split(":")[0] : h;
}

function safePathSuffix(raw: string) {
  // ensure leading slash
  let s = raw.trim();
  if (!s.startsWith("/")) s = "/" + s;

  // collapse repeated slashes
  s = s.replace(/\/{2,}/g, "/");

  // block traversal / weirdness
  if (s.includes("..")) return "/";
  if (s.includes("\\")) return "/";

  // allow only safe URL path chars
  // (keeps it conservative; relax later if you need more)
  if (!/^\/[a-zA-Z0-9\-._~\/]*$/.test(s)) return "/";

  return s;
}

async function findProjectByDomain(domain: string) {
  const now = Date.now();
  const cached = DOMAIN_CACHE.get(domain);
  if (cached && cached.expiresAt > now) return cached;

  const entries = await fs.readdir(DATA_ROOT).catch(() => []);
  for (const pid of entries) {
    try {
      const metaRaw = await fs.readFile(path.join(DATA_ROOT, pid, "metadata.json"), "utf8");
      const meta = JSON.parse(metaRaw);

      const cd = typeof meta?.customDomain === "string" ? normalizeHost(meta.customDomain) : null;
      const lastPublishId = typeof meta?.lastPublishId === "string" ? meta.lastPublishId : null;

      if (cd && cd === domain && lastPublishId) {
        const val = { pid, publishId: lastPublishId, expiresAt: now + CACHE_TTL_MS };
        DOMAIN_CACHE.set(domain, val);
        return val;
      }
    } catch {
      // ignore bad projects
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hostParam = url.searchParams.get("host");
  const pathParam = url.searchParams.get("path") ?? "/";

  if (!hostParam) return NextResponse.json({ ok: false }, { status: 400 });

  const host = normalizeHost(hostParam);
  const pathSuffix = safePathSuffix(pathParam);

  try {
    const found = await findProjectByDomain(host);
    if (!found) return NextResponse.json({ ok: false });

    const fullPath =
      `/published/${found.pid}/${found.publishId}` + (pathSuffix === "/" ? "" : pathSuffix);

    return NextResponse.json({ ok: true, path: fullPath });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
