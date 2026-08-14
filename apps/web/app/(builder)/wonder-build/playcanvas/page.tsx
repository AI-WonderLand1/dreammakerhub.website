"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { logger } from '@/lib/logger';
import Real3DPreview from "@/components/engines/Real3DPreview";

type SceneTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  glbUrl?: string;
  nodes?: any[];
  environment?: { skybox?: string; ambient?: number[] };
};

function TemplateGallery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sceneIdParam = searchParams?.get("sceneId")?.trim();
  const sceneParam = searchParams?.get("scene")?.trim();

  useEffect(() => {
    if (sceneIdParam) {
      router.replace(`/wonder-build/playcanvas/editor/${sceneIdParam}`);
    } else if (sceneParam) {
      router.replace(`/wonder-build/playcanvas/editor/${sceneParam}`);
    }
  }, [sceneIdParam, sceneParam, router]);

  const [templates, setTemplates] = useState<SceneTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scenes/templates")
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/wonder-build" className="text-sm text-white/50 hover:text-white">← Back to Hub</Link>
            <h1 className="mt-2 text-2xl font-bold">Scene Templates</h1>
            <p className="mt-1 text-sm text-white/50">Pick a template to start editing in PlayCanvas</p>
          </div>
          <Link
            href="/wonder-build/playcanvas/editor/blank_canvas"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
          >
            Start Blank
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid cards={6} />
        ) : templates.length === 0 ? (
          <EmptyState
            title="No templates available"
            description="Create a new scene from scratch"
            cta={
              <Link
                href="/wonder-build/playcanvas/editor/blank_canvas"
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
              >
                Start Blank
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/wonder-build/playcanvas/editor/${template.id}`}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-purple-500/50 hover:bg-white/10"
              >
                <Real3DPreview
                  seed={template.id}
                  preset={template.category}
                  glbUrl={template.glbUrl}
                  sceneData={{ nodes: template.nodes, environment: template.environment }}
                  className="aspect-video w-full"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-purple-300">{template.name}</h3>
                  <p className="mt-1 text-xs text-white/60 line-clamp-2">{template.description}</p>
                  <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                    {template.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-4 text-sm">
          <Link href="/dashboard/projects" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
            Dashboard
          </Link>
          <Link href="/game-builder/create" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
            Game Builder
          </Link>
          <Link href="/library" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
            Asset Library
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PlayCanvasGalleryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white/50 text-sm">Loading templates…</div>}>
      <TemplateGallery />
    </Suspense>
  );
}
