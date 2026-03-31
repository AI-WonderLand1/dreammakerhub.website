import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { createProject } from "@/lib/projects/createProject";
import { listProjects } from "@/lib/projects/listProjects";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);

  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerId = smokeUserId ?? user!.id;
  const projects = await listProjects(ownerId);

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const smokeUserId = getSmokeUserIdFromRequest(req);

    if (!user && !smokeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = smokeUserId ?? user!.id;
    const { name, tool } = await req.json();

    const project = await createProject(
      ownerId,
      name || "New Sovereign Build",
      tool || "wonder-build"
    );

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error("Critical API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
