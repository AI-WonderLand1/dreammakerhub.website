"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { listProjects, Project } from "@lib/wonder-build/projects";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await listProjects();
        if (!cancelled) setProjects(data);
      } catch (err) {
        if (!cancelled) setError("Failed to load projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-8 space-y-4">
      <header>
        <h1 className="text-3xl font-bold mb-2">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Open your workspaces or jump straight into Wonder-Build.
        </p>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : projects.length === 0 ? (
        <p>Your projects will appear here...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border rounded-lg p-4 bg-white/5 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{project.name}</h2>
                <span className="text-xs text-slate-500">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/wonder-build?projectId=${project.id}`}
                  className="px-3 py-2 rounded-md bg-purple-600 text-white text-sm"
                >
                  Open in Wonder-Build
                </Link>
                <Link
                  href={`/workspace/wonderspace/${project.id}`}
                  className="px-3 py-2 rounded-md border text-sm"
                >
                  Open Workspace
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
