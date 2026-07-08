import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { convertHtmlToPuck } from "@/lib/html-to-puck";
import { CoderAPIWrapper } from "@/lib/coder/api-wrapper";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, code, prompt, name } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const projectId = `wb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const projectName = name || (prompt ? prompt.slice(0, 50) : `AI Build ${new Date().toLocaleDateString()}`);

    // Provision private Coder workspace for this user
    const { data: { session } } = await supabase.auth.getSession();
    const coderToken = session?.access_token;
    const coder = new CoderIntegration();
    const { ideUrl } = await coder.provisionIDEForProject(
      user.id,
      projectName,
      code,
      coderToken
    );

    // Also save to Puck for fallback
    let content;
    
    if (type === "website" || type === "component") {
      content = convertHtmlToPuck(code, prompt);
    } else {
      content = {
        content: [
          {
            type: "centerHero",
            props: {
              title: "Generated Build",
              subtitle: "Open in editor to customize",
            },
          },
        ],
        root: { type: "Fragment", props: {} },
      };
    }

    const { data: project, error: saveError } = await supabase
      .from("puck_projects")
      .insert({
        id: projectId,
        user_id: user.id,
        content,
        meta: {
          type,
          prompt: prompt?.slice(0, 500),
          generatedAt: new Date().toISOString(),
          rawHtml: code.slice(0, 50000),
          coderWorkspaceUrl: ideUrl,
        },
        storage_type: "temp",
        temp_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error("[CreateFromBuild] Save error:", saveError);
      
      return NextResponse.json({
        projectId,
        url: ideUrl, // Redirect to Coder workspace
        content,
        message: "Project created with private IDE workspace",
      });
    }

    return NextResponse.json({
      ok: true,
      projectId,
      url: ideUrl, // Redirect to Coder workspace
      content,
      message: "Your private IDE workspace is ready!",
    });
  } catch (error) {
    console.error("[CreateFromBuild] Error:", error);
    
    // Fallback to Puck editor if Coder fails
    return NextResponse.json({
      projectId: `wb-${Date.now().toString(36)}`,
      url: `/wonder-build/puck?project=fallback`,
      message: "Using fallback editor (Coder workspace creation failed)",
    });
  }
}