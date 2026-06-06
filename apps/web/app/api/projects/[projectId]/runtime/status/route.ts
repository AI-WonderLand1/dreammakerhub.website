import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { KubeConfig, CoreV1Api, AppsV1Api } from "@kubernetes/client-node";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, name, engine, created_at, updated_at")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
    }

    let status = "stopped";
    let health = null;

    try {
      const kc = new KubeConfig();
      
      try {
        kc.loadFromCluster();
      } catch {
        kc.loadFromDefault();
      }
      
      const appsApi = kc.makeApiClient(AppsV1Api);
      
      const deployment = await appsApi.readNamespacedDeployment(
        `wonder-runtime-${projectId}`,
        'default'
      );
      
      const readyReplicas = deployment.body?.status?.readyReplicas;
      const availableReplicas = deployment.body?.status?.availableReplicas;
      
      if (readyReplicas === 1 || availableReplicas === 1) {
        status = "running";
        
        const coreApi = kc.makeApiClient(CoreV1Api);
        const service = await coreApi.readNamespacedService(
          `wonder-runtime-${projectId}`,
          'default'
        );
        
        const clusterIP = service.body?.spec?.clusterIP;
        
        if (clusterIP) {
          try {
            const healthRes = await fetch(`http://${clusterIP}:3090/health`, {
              signal: AbortSignal.timeout(5000)
            });
            
            if (healthRes.ok) {
              health = await healthRes.json();
            }
          } catch {
            health = { error: "cannot reach health endpoint" };
          }
        }
      } else if (deployment.body?.status?.replicas === 1) {
        status = "starting";
      } else {
        status = "stopped";
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        status = "stopped";
      } else {
        status = "error";
        console.error("Status check error:", error.message);
      }
    }

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      engine: project.engine,
      status,
      runtimeUrl: status === "running" 
        ? `/api/projects/${projectId}/runtime/proxy` 
        : null,
      internalUrl: status === "running"
        ? `wonder-runtime-${projectId}:3090`
        : null,
      health,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    });
  } catch (error: any) {
    console.error("Runtime status error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === "start") {
      const { createProjectRuntime } = await import("@/lib/workspace/provisioner");
      const result = await createProjectRuntime(projectId);
      return NextResponse.json(result);
    }

    if (action === "stop") {
      const { deleteProjectRuntime } = await import("@/lib/workspace/provisioner");
      const result = await deleteProjectRuntime(projectId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action. Use action: 'start' or 'stop'" }, { status: 400 });
  } catch (error: any) {
    console.error("Runtime action error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}