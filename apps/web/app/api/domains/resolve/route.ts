import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// Cache configuration
type CacheValue = { pid: string; publishId: string; expiresAt: number };
const DOMAIN_CACHE = new Map<string, CacheValue>();
const CACHE_TTL_MS = 60_000; // 60s
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Periodically clean cache
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of DOMAIN_CACHE.entries()) {
      if (now > value.expiresAt) {
        DOMAIN_CACHE.delete(key);
      }
    }
  }, CACHE_CLEANUP_INTERVAL);
}

function normalizeHost(raw: string): string {
  const host = raw.trim().toLowerCase();
  // Remove port if present
  return host.includes(":") ? host.split(":")[0] : host;
}

function safePathSuffix(raw: string): string {
  let path = raw.trim();
  
  // Ensure leading slash
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  
  // Collapse repeated slashes
  path = path.replace(/\/{2,}/g, "/");
  
  // Security: Block path traversal
  if (path.includes("..") || path.includes("\\")) {
    return "/";
  }
  
  // Allow only safe URL path characters
  if (!/^\/[a-zA-Z0-9\-._~\/]*$/.test(path)) {
    return "/";
  }
  
  return path;
}

interface ProjectDomain {
  project_id: string;
  publish_id: string;
  custom_domain: string;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

async function findProjectByDomain(domain: string): Promise<CacheValue | null> {
  const now = Date.now();
  
  // Check cache first
  const cached = DOMAIN_CACHE.get(domain);
  if (cached && cached.expiresAt > now) {
    logger.debug("Domain cache hit", { domain, cached });
    return cached;
  }
  
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from("project_domains")
      .select("project_id, publish_id, custom_domain, is_active, verified_at")
      .eq("custom_domain", domain)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      logger.debug("Domain not found in Supabase", { domain, error: error?.message });
      return null;
    }
    
    const projectDomain = data as ProjectDomain;
    
    // Only return if domain is verified
    if (!projectDomain.verified_at) {
      logger.debug("Domain not verified", { domain });
      return null;
    }
    
    const cacheValue: CacheValue = {
      pid: projectDomain.project_id,
      publishId: projectDomain.publish_id,
      expiresAt: now + CACHE_TTL_MS
    };
    
    DOMAIN_CACHE.set(domain, cacheValue);
    logger.info("Domain resolved", { domain, projectId: projectDomain.project_id });
    
    return cacheValue;
  } catch (error: any) {
    logger.error("Error finding project by domain", { 
      domain, 
      error: error.message,
      stack: error.stack 
    });
    return null;
  }
}

export async function GET(req: NextRequest) {
  const traceId = crypto.randomUUID();
  const url = new URL(req.url);
  const hostParam = url.searchParams.get("host");
  const pathParam = url.searchParams.get("path") ?? "/";
  
  logger.debug("Domain resolution request", { 
    traceId, 
    hostParam, 
    pathParam,
    url: req.url 
  });
  
  if (!hostParam) {
    return NextResponse.json({ 
      ok: false, 
      error: "Missing host parameter",
      traceId 
    }, { status: 400 });
  }
  
  const host = normalizeHost(hostParam);
  const pathSuffix = safePathSuffix(pathParam);
  
  try {
    const found = await findProjectByDomain(host);
    
    if (!found) {
      logger.debug("Domain not found", { traceId, host });
      return NextResponse.json({ 
        ok: false, 
        error: "Domain not found or not verified",
        traceId 
      });
    }
    
    const fullPath = `/published/${found.pid}/${found.publishId}` + 
      (pathSuffix === "/" ? "" : pathSuffix);
    
    logger.info("Domain resolved successfully", { 
      traceId, 
      host, 
      projectId: found.pid,
      publishId: found.publishId,
      fullPath 
    });
    
    return NextResponse.json({ 
      ok: true, 
      path: fullPath,
      projectId: found.pid,
      publishId: found.publishId,
      traceId 
    });
    
  } catch (error: any) {
    logger.error("Domain resolution error", { 
      traceId, 
      host, 
      error: error.message,
      stack: error.stack 
    });
    
    return NextResponse.json({ 
      ok: false, 
      error: "Internal server error",
      traceId 
    }, { status: 500 });
  }
}
