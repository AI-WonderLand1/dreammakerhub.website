import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@lib/logger';
import { createClient } from '@/app/utils/supabase/server';
import { createSnapshot, ensureDefaultProject } from '@lib/projects/storage';
import { generateAndSaveProject } from '@core/ai/orchestrator';
import { getSmokeUserIdFromRequest } from '@lib/smokeAuth';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const smokeUserId = getSmokeUserIdFromRequest(req);
    if (!user && !smokeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const moduleId = typeof body?.moduleId === "string" ? body.moduleId.trim() : "";
    const mode = body?.mode === "apply" ? "apply" : "test";
    const projectId = typeof body?.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : null;

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }
    if (mode === "apply" && !projectId) {
      return NextResponse.json({ error: 'projectId required for apply' }, { status: 400 });
    }

    const ownerId = smokeUserId ?? user!.id;
    const project = projectId
      ? { id: projectId }
      : await ensureDefaultProject(ownerId, "Playground Project");

    let snapshotId: string | undefined;
    if (mode === "apply") {
      try {
        const snapshot = await createSnapshot(project.id, ownerId);
        snapshotId = snapshot.id;
      } catch (error: any) {
        logger.error("Snapshot creation failed before apply", { error });
      }
    }

    // Handle Confessions AI module via LiteLLM proxy
    if (moduleId === "confessions") {
      const proxyRes = await fetch("http://localhost:4000/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.LITELLM_PROXY_API_KEY || "sk-1234"}`
        },
        body: JSON.stringify({
          model: "litellm_proxy/confessions-model",
          messages: [{ role: "user", content: prompt }],
          extra_body: { tags: [`user:${ownerId}`, "source:playground"] }
        })
      });

      if (!proxyRes.ok) {
        const err = await proxyRes.json().catch(() => ({}));
        throw new Error(err.error || "Confessions AI request failed");
      }

      const proxyData = await proxyRes.json();
      return NextResponse.json({
        ok: true,
        moduleId: "confessions",
        message: proxyData.choices?.[0]?.message?.content || "No response",
        preview: { summary: proxyData.choices?.[0]?.message?.content || "" }
      });
    }

    const result = await generateAndSaveProject({
      projectId: project.id,
      ownerId,
      prompt,
      agentId: body?.agentId,
      mode,
    });

    return NextResponse.json({
      ok: true,
      moduleId,
      mode,
      projectId: project.id,
      preview: result.preview,
      applied: result.changedFiles ? { changedFiles: result.changedFiles, snapshotId } : undefined,
      message: mode === "apply" ? "Generated and saved project files" : "Preview generated",
    });
  } catch (error: any) {
    logger.error('Playground run failed', { error });
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
