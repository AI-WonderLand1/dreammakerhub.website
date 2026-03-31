import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TenantMap = Record<string, string>;

export function parseTenantFromHost(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = hostHeader.split(":")[0].toLowerCase();
  const parts = host.split(".");
  if (parts.length < 3) return null;
  return parts[0] || null;
}

export function resolveTheiaUpstream(tenant: string | null, mapJson: string | undefined): string | null {
  if (!tenant || !mapJson?.trim()) return null;

  try {
    const parsed = JSON.parse(mapJson) as TenantMap;
    const upstream = parsed[tenant];
    if (!upstream) return null;
    return upstream.endsWith("/") ? upstream.slice(0, -1) : upstream;
  } catch {
    return null;
  }
}

async function proxy(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const tenant = parseTenantFromHost(request.headers.get("host"));
  const upstream = resolveTheiaUpstream(tenant, process.env.TENANT_THEIA_MAP);

  if (!upstream) {
    return NextResponse.json({ error: "No Theia upstream configured for tenant." }, { status: 404 });
  }

  const targetPath = path.join("/");
  const targetUrl = `${upstream}/${targetPath}${request.nextUrl.search}`;

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    duplex: "half",
    redirect: "manual",
  } as RequestInit);

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: upstreamResponse.headers,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params);
}
