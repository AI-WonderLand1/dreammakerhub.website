import https from "node:https";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const METADATA_HOSTNAMES = new Set([
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.internal",
  "100.100.100.200",
]);

const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/\.+$/, "");
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

function isUnsafeIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isPrivateIpv4(ip);
  if (family === 6) return isPrivateIpv6(ip);
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    METADATA_HOSTNAMES.has(host)
  );
}

export function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return true;

    const host = normalizeHostname(parsed.hostname);
    if (isBlockedHostname(host)) return true;

    const family = isIP(host);
    if (family > 0) return isUnsafeIp(host);

    return false;
  } catch {
    return true;
  }
}

async function resolveSafeAddress(hostname: string): Promise<{ address: string; family: 4 | 6 }> {
  const host = normalizeHostname(hostname);
  if (isBlockedHostname(host)) throw new Error("Blocked provider hostname");

  const directFamily = isIP(host);
  if (directFamily) {
    if (isUnsafeIp(host)) throw new Error("Provider URL targets a private network");
    return { address: host, family: directFamily as 4 | 6 };
  }

  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length) throw new Error("Provider hostname did not resolve");

  for (const record of records) {
    if (isUnsafeIp(record.address)) {
      throw new Error("Provider hostname resolves to a private network");
    }
  }

  const selected = records[0];
  return { address: selected.address, family: selected.family as 4 | 6 };
}

async function pinnedHttpsRequest(url: URL, init: RequestInit, address: string): Promise<Response> {
  const requestHeaders = Object.fromEntries(new Headers(init.headers).entries());

  return new Promise<Response>((resolve, reject) => {
    const request = https.request(
      {
        protocol: "https:",
        hostname: address,
        port: url.port ? Number(url.port) : 443,
        path: `${url.pathname}${url.search}`,
        method: init.method || "GET",
        headers: {
          ...requestHeaders,
          host: url.host,
        },
        servername: url.hostname,
        rejectUnauthorized: true,
        timeout: 30_000,
        signal: init.signal instanceof AbortSignal ? init.signal : undefined,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;

        response.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("Provider response exceeded size limit"));
            return;
          }
          chunks.push(chunk);
        });

        response.on("end", () => {
          resolve(new Response(Buffer.concat(chunks), {
            status: response.statusCode || 502,
            statusText: response.statusMessage,
            headers: new Headers(response.headers as Record<string, string>),
          }));
        });
      },
    );

    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error("Provider request timed out")));

    if (typeof init.body === "string" || init.body instanceof Uint8Array) {
      request.write(init.body);
    } else if (init.body != null) {
      request.destroy(new Error("Unsupported provider request body"));
      return;
    }

    request.end();
  });
}

/**
 * Fetch an arbitrary user-configured HTTPS provider without allowing DNS
 * rebinding into localhost/private networks or cross-host credential-leaking
 * redirects. DNS is resolved once and the TLS connection is pinned to that
 * verified public address while preserving SNI/Host for certificate checks.
 */
export async function safeExternalFetch(rawUrl: string, init: RequestInit = {}): Promise<Response> {
  let currentUrl: URL;
  try {
    currentUrl = new URL(rawUrl);
  } catch {
    throw new Error("Invalid provider URL");
  }

  if (currentUrl.protocol !== "https:") throw new Error("Provider URL must use HTTPS");
  if (currentUrl.username || currentUrl.password) throw new Error("Provider URL must not contain credentials");

  const originalHostname = normalizeHostname(currentUrl.hostname);
  if (isBlockedHostname(originalHostname)) throw new Error("Blocked provider hostname");

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const currentHostname = normalizeHostname(currentUrl.hostname);
    if (currentHostname !== originalHostname) {
      throw new Error("Cross-host provider redirects are not allowed");
    }

    const { address } = await resolveSafeAddress(currentHostname);
    const response = await pinnedHttpsRequest(currentUrl, init, address);

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get("location");
    if (!location) return response;
    if (redirectCount === MAX_REDIRECTS) throw new Error("Too many provider redirects");

    const nextUrl = new URL(location, currentUrl);
    if (nextUrl.protocol !== "https:") throw new Error("Provider redirect must use HTTPS");
    if (normalizeHostname(nextUrl.hostname) !== originalHostname) {
      throw new Error("Cross-host provider redirects are not allowed");
    }
    currentUrl = nextUrl;
  }

  throw new Error("Provider redirect failed");
}
