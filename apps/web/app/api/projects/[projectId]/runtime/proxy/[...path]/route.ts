import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { createServer } from "http";
import { parse } from "url";
import { KubeConfig, CoreV1Api } from "@kubernetes/client-node";

export const runtime = "nodejs";

const RUNTIME_SERVICE_PREFIX = "wonder-runtime-";
const RUNTIME_PORT = 3090;

async function getRuntimeUrl(projectId: string): Promise<string | null> {
  const kc = new KubeConfig();
  
  try {
    kc.loadFromCluster();
  } catch {
    kc.loadFromDefault();
  }
  
  const coreApi = kc.makeApiClient(CoreV1Api);
  
  try {
    const result = await coreApi.readNamespacedService(
      `${RUNTIME_SERVICE_PREFIX}${projectId}`,
      'default'
    );
    
    if (result.body?.spec?.clusterIP) {
      return `http://${result.body.spec.clusterIP}:${RUNTIME_PORT}`;
    }
  } catch {}
  
  return `http://${RUNTIME_SERVICE_PREFIX}${projectId}:${RUNTIME_PORT}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string; path: string }> }) {
  try {
    const { projectId, path } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const upgrade = req.headers.get("upgrade");
    
    if (upgrade === "websocket") {
      return handleWebSocket(req, projectId, user.id);
    }

    const runtimeUrl = await getRuntimeUrl(projectId);
    
    if (!runtimeUrl) {
      return NextResponse.json({ error: "Runtime not found" }, { status: 404 });
    }

    const targetPath = `/${path}`;
    const targetUrl = `${runtimeUrl}${targetPath}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-Forwarded-User': user.id,
        'X-Forwarded-Project': projectId
      },
      signal: AbortSignal.timeout(60000)
    });

    const contentType = response.headers.get("content-type");
    const data = await response.arrayBuffer();

    const headers = new Headers();
    headers.set("X-Project-ID", projectId);
    headers.set("X-User-ID", user.id);
    
    if (contentType) {
      headers.set("content-type", contentType);
    }

    return new NextResponse(data, { status: response.status, headers });
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string; path: string }> }) {
  try {
    const { projectId, path } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const runtimeUrl = await getRuntimeUrl(projectId);
    
    if (!runtimeUrl) {
      return NextResponse.json({ error: "Runtime not found" }, { status: 404 });
    }

    const targetPath = `/${path}`;
    const targetUrl = `${runtimeUrl}${targetPath}`;

    const body = await req.text();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        'X-Forwarded-User': user.id,
        'X-Forwarded-Project': projectId
      },
      body,
      signal: AbortSignal.timeout(120000)
    });

    const contentType = response.headers.get("content-type");
    const data = await response.arrayBuffer();

    const headers = new Headers();
    headers.set("X-Project-ID", projectId);
    
    if (contentType) {
      headers.set("content-type", contentType);
    }

    return new NextResponse(data, { status: response.status, headers });
  } catch (error: any) {
    console.error("Proxy POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleWebSocket(req: NextRequest, projectId: string, userId: string): Promise<NextResponse> {
  try {
    const runtimeUrl = await getRuntimeUrl(projectId);
    
    if (!runtimeUrl) {
      return NextResponse.json({ error: "Runtime not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      error: "WebSocket requires direct connection",
      instructions: "Connect directly to runtime at: " + runtimeUrl,
      runtimeUrl: runtimeUrl,
      hint: "WebSocket connections should be made directly to the runtime service, not through the API gateway"
    }, { status: 400 });
  } catch (error: any) {
    console.error("WebSocket error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string; path: string }> }) {
  return POST(req, { params });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string; path: string }> }) {
  return POST(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string; path: string }> }) {
  return POST(req, { params });
}