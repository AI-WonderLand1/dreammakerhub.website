"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { logger } from '@/lib/logger';

type SceneTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
};

function SceneLibraryInner() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<SceneTemplate[]>([]);

  useEffect(() => {
    fetch("/api/scenes/templates")
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-4">AI Wonderland Scene Library</h1>
          <p className="text-white/60 mt-2">Choose a starting world for your WonderPlay 3D project</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/${template.id}`}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-purple-500/50 hover:bg-white/10"
              >
                {template.thumbnail ? (
                  <Image
                    src={template.thumbnail}
                    alt={template.name}
                    width={300}
                    height={200}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-purple-900/30 to-blue-900/30" />
                )}
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
      </div>
    </div>
  );
}

export default function SceneLibraryPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black text-white/50">
        Loading...
      </div>
    }>
      <SceneLibraryInner />
    </Suspense>
  );
}