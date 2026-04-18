"use client";


import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PlayCanvasEditorHost from "@/components/PlayCanvasEditorHost";
import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";
import NpcPanel from "@/components/NpcPanel";
import { setupTheatreBridge } from "@/lib/theatreBridgeSetup";
import { createNpcProviderFromEnv } from "@/lib/ai/convaiNpcProvider";
import { buildPlayCanvasEditorUrl, getPlayCanvasMode } from "@/lib/playcanvas";
import type { ArtifactMetadata } from "@/lib/wonderspace/artifacts";

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const BRIDGE_READY_TIMEOUT_MS = 10_000;
const GLB_SIZE_LIMIT_MB = 25;

type IntegrationMode = "link" | "fork" | "new";
type WorkspaceProject = {
  id: string;
  name: string;
  workspaceOwner: string;
  sceneId: string | null;
  playcanvasProjectId: string | null;
  integrationMode: IntegrationMode;
  cloudConnectionId: string | null;
};

type CloudConnection = {
  id: string;
  name: string;
  provider: "s3" | "gcs" | "azure" | "r2";
  status: "connected" | "disconnected";
};

export default function EditorPlayCanvasPage() {
  const params = useSearchParams();
  const sceneId = params.get("sceneId")?.trim() ?? "";
  const projectId = params.get("projectId")?.trim() || "default";
  const [selectedSetupProjectId, setSelectedSetupProjectId] = useState(projectId);
  const [bridgeLoading, setBridgeLoading] = useState(Boolean(sceneId));
  const [bridgeFailed, setBridgeFailed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactMetadata[]>([]);
  const [artifactsLoading, setArtifactsLoading] = useState(true);
  const [artifactsError, setArtifactsError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupProjects, setSetupProjects] = useState<WorkspaceProject[]>([]);
  const [setupMode, setSetupMode] = useState<IntegrationMode>("new");
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [cloudConnections, setCloudConnections] = useState<CloudConnection[]>([]);
  const [setupForm, setSetupForm] = useState({
    name: "",
    workspaceOwner: "",
    sceneId,
    playcanvasProjectId: "",
    cloudConnectionId: "",
  });
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [glbFeedback, setGlbFeedback] = useState<string>("Pick a .glb file to validate before saving.");

  const selectedSetupProject = useMemo(
    () => setupProjects.find((project) => project.id === selectedSetupProjectId) ?? null,
    [selectedSetupProjectId, setupProjects],
  );
  const selectedCloudConnection = useMemo(
    () => cloudConnections.find((connection) => connection.id === setupForm.cloudConnectionId) ?? null,
    [cloudConnections, setupForm.cloudConnectionId],
  );
  const effectiveSceneId = sceneId || selectedSetupProject?.sceneId || "";

  const playCanvasMode = getPlayCanvasMode();
  const editorUrl = useMemo(() => buildPlayCanvasEditorUrl(effectiveSceneId), [effectiveSceneId]);
  const npcProvider = useMemo(() => createNpcProviderFromEnv(), []);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  useEffect(() => {
    setBridgeLoading(Boolean(effectiveSceneId));
    setBridgeFailed(false);
    setSetupForm((prev) => ({ ...prev, sceneId }));
  }, [effectiveSceneId, sceneId]);

  useEffect(() => {
    setSelectedSetupProjectId(projectId);
  }, [projectId]);

  const loadSetupProjects = useCallback(async () => {
    setSetupLoading(true);
    try {
      const response = await fetch("/api/wonderspace/projects");
      if (!response.ok) {
        throw new Error("Failed to load setup projects");
      }
      const payload = (await response.json()) as { projects?: WorkspaceProject[] };
      const projects = payload.projects ?? [];
      setSetupProjects(projects);
      setSelectedSetupProjectId((current) => {
        if (projects.some((project) => project.id === current)) {
          return current;
        }
        if (projects.some((project) => project.id === projectId)) {
          return projectId;
        }
        return projects[0]?.id ?? current;
      });
    } catch {
      pushToast({
        message: "Failed to load linked PlayCanvas projects.",
        tone: "error",
        actionLabel: "Retry",
        onAction: () => {
          void loadSetupProjects();
        },
      });
    } finally {
      setSetupLoading(false);
    }
  }, [projectId, pushToast]);

  const loadCloudConnections = useCallback(async () => {
    try {
      const response = await fetch("/api/cloud-connections");
      if (!response.ok) {
        throw new Error("Failed to load cloud connections");
      }
      const payload = (await response.json()) as { connections?: CloudConnection[] };
      setCloudConnections(payload.connections ?? []);
    } catch {
      pushToast({
        message: "Failed to load cloud connections.",
        tone: "error",
      });
    }
  }, [pushToast]);

  const loadArtifacts = useCallback(async () => {
    setArtifactsLoading(true);
    setArtifactsError(null);

    try {
      const response = await fetch(`/api/wonderspace/projects/${encodeURIComponent(projectId)}/artifacts`);
      if (!response.ok) {
        throw new Error("Failed to fetch exports");
      }

      const payload = (await response.json()) as { artifacts?: ArtifactMetadata[] };
      setArtifacts(payload.artifacts ?? []);
    } catch {
      setArtifactsError("Could not load previous PlayCanvas exports.");
      pushToast({
        message: "Unable to load previous exports.",
        tone: "error",
        actionLabel: "Retry",
        onAction: () => {
          void loadArtifacts();
        },
      });
    } finally {
      setArtifactsLoading(false);
    }
  }, [projectId, pushToast]);

  useEffect(() => {
    void loadArtifacts();
    void loadSetupProjects();
    void loadCloudConnections();
  }, [loadArtifacts, loadCloudConnections, loadSetupProjects]);

  useEffect(() => {
    let mounted = true;

    setupTheatreBridge(window as unknown as Record<string, unknown>).catch(() => {
      if (mounted) {
        pushToast({ message: "Theatre editor tools failed to initialize.", tone: "error" });
      }
    });

    return () => {
      mounted = false;
    };
  }, [pushToast]);

  const uploadArtifact = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.set("file", file);

      setIsUploading(true);
      try {
        const response = await fetch(`/api/wonderspace/projects/${encodeURIComponent(projectId)}/artifacts/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        pushToast({ message: "PlayCanvas export uploaded.", tone: "success" });
        await loadArtifacts();
      } catch {
        pushToast({
          message: "Failed to upload PlayCanvas export.",
          tone: "error",
          actionLabel: "Retry",
          onAction: () => {
            void uploadArtifact(file);
          },
        });
      } finally {
        setIsUploading(false);
      }
    },
    [loadArtifacts, projectId, pushToast],
  );

  useEffect(() => {
    if (!effectiveSceneId || !bridgeLoading || bridgeFailed) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBridgeLoading(false);
      setBridgeFailed(true);
      pushToast({ message: "PlayCanvas embed did not become ready. Continue in a new tab.", tone: "error" });
    }, BRIDGE_READY_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bridgeFailed, bridgeLoading, effectiveSceneId, pushToast]);

  const validateGlbFile = useCallback((file: File | null) => {
    if (!file) {
      setGlbFeedback("Pick a .glb file to validate before saving.");
      return false;
    }
    if (!file.name.toLowerCase().endsWith(".glb")) {
      setGlbFeedback("Invalid file: only .glb files are accepted.");
      return false;
    }
    const maxBytes = GLB_SIZE_LIMIT_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setGlbFeedback(`File too large: keep GLB assets under ${GLB_SIZE_LIMIT_MB}MB.`);
      return false;
    }
    setGlbFeedback("Validation passed: this GLB can be imported.");
    return true;
  }, []);

  const saveProjectSetup = useCallback(async () => {
    setSetupSaving(true);
    setSetupError(null);

    if (!setupForm.name.trim() || !setupForm.workspaceOwner.trim()) {
      setSetupError("Project name and workspace owner are required.");
      setSetupSaving(false);
      return;
    }

    if (setupMode === "link" && (!setupForm.sceneId.trim() || !setupForm.playcanvasProjectId.trim())) {
      setSetupError("Scene ID and PlayCanvas project ID are required for linked projects.");
      setSetupSaving(false);
      return;
    }

    if (!validateGlbFile(glbFile)) {
      setSetupSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/wonderspace/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: setupForm.name,
          workspaceOwner: setupForm.workspaceOwner,
          sceneId: setupForm.sceneId || null,
          playcanvasProjectId: setupForm.playcanvasProjectId || null,
          integrationMode: setupMode,
          cloudConnectionId: setupForm.cloudConnectionId || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to save project setup");
      }

      pushToast({ message: "Project setup saved.", tone: "success" });
      await loadSetupProjects();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save project setup";
      setSetupError(message);
      pushToast({
        message,
        tone: "error",
        actionLabel: "Retry",
        onAction: () => {
          void saveProjectSetup();
        },
      });
    } finally {
      setSetupSaving(false);
    }
  }, [glbFile, loadSetupProjects, pushToast, setupForm, setupMode, validateGlbFile]);

  return (
    <div className="space-y-4">
      <ToastStack toasts={toasts} />

      <PageHeader
        lead={<Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "PlayCanvas Bridge" }]} />}
        title="PlayCanvas Editor Bridge"
        subtitle="Connect your PlayCanvas scene in one click. Use ?sceneId=<id> on this route to load your editor context."
        action={null}
      />

      <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80">
        <span className="font-semibold">PlayCanvas mode:</span>
        <span className="rounded-full bg-black/40 px-2 py-0.5 uppercase tracking-wide">{playCanvasMode}</span>
        {playCanvasMode === "direct" ? <span className="text-cyan-300">NEXT_PUBLIC_PLAYCANVAS_MODE=direct</span> : null}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/wonder-build/playcanvas" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
          Open WonderPlay Route
        </Link>
        <Link href="/wonder-build/playcanvas" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
          Open PlayCanvas Studio
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-white">Project Setup</h2>
        <p className="mt-1 text-sm text-white/65">Link an existing scene, fork a template project, or create a net-new project record for your workspace.</p>

        <div className="mt-4 max-w-md">
          <label className="text-sm font-semibold text-white" htmlFor="project-picker">
            Active project record
          </label>
          <select
            id="project-picker"
            className="mt-2 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            value={selectedSetupProjectId}
            onChange={(event) => setSelectedSetupProjectId(event.target.value)}
            disabled={setupLoading || setupProjects.length === 0}
          >
            {setupProjects.length === 0 ? <option value={selectedSetupProjectId}>No projects available</option> : null}
            {setupProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.sceneId ?? "No scene"})
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-white/65">URL sceneId overrides this selection when provided.</p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white">Setup mode</label>
            <select
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
              value={setupMode}
              onChange={(event) => setSetupMode(event.target.value as IntegrationMode)}
            >
              <option value="link">Link existing sceneId</option>
              <option value="fork">Fork template project</option>
              <option value="new">Create new project record</option>
            </select>

            <input
              placeholder="Workspace project name"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
              value={setupForm.name}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              placeholder="Workspace owner"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
              value={setupForm.workspaceOwner}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, workspaceOwner: event.target.value }))}
            />
            <input
              placeholder="PlayCanvas project ID"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
              value={setupForm.playcanvasProjectId}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, playcanvasProjectId: event.target.value }))}
            />
            <input
              placeholder="Scene ID"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
              value={setupForm.sceneId}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, sceneId: event.target.value }))}
            />
            <label className="text-sm font-semibold text-white">Cloud connection</label>
            <select
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
              value={setupForm.cloudConnectionId}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, cloudConnectionId: event.target.value }))}
            >
              <option value="">No cloud connection</option>
              {cloudConnections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.name} ({connection.provider.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="text-xs text-white/65">
              {selectedCloudConnection ? `Connected: ${selectedCloudConnection.name} (${selectedCloudConnection.status})` : "No cloud connection linked."}
            </p>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <h3 className="text-sm font-semibold text-white">GLB import checklist</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/70">
                <li>Recommended formats: binary .glb (PBR materials), Draco-compressed meshes, and power-of-two textures.</li>
                <li>Size limit: {GLB_SIZE_LIMIT_MB}MB per GLB file.</li>
                <li>Validation feedback is required before setup save.</li>
              </ul>
              <label className="mt-3 inline-flex cursor-pointer rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90">
                Choose GLB
                <input
                  type="file"
                  accept=".glb,model/gltf-binary"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setGlbFile(file);
                    validateGlbFile(file);
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-white/75">{glbFeedback}</p>
            </div>

            {setupError ? <p className="text-sm text-red-300">{setupError}</p> : null}

            <button
              type="button"
              disabled={setupSaving}
              className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 text-sm font-bold text-white disabled:opacity-70"
              onClick={() => {
                void saveProjectSetup();
              }}
            >
              {setupSaving ? "Saving setup…" : "Save setup"}
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Workspace setup records</h3>
            <div className="mt-3">
              {setupLoading ? (
                <SkeletonGrid cards={1} />
              ) : setupProjects.length === 0 ? (
                <EmptyState title="No setup records yet" description="Save your first setup record to track scene ownership and PlayCanvas linkage." />
              ) : (
                <div className="space-y-2">
                  {setupProjects.slice(0, 4).map((project) => (
                    <div key={project.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-sm font-semibold text-white">{project.name}</p>
                      <p className="text-xs text-white/70">Owner: {project.workspaceOwner}</p>
                      <p className="text-xs text-white/70">
                        PlayCanvas: {project.playcanvasProjectId ?? "N/A"} · Scene: {project.sceneId ?? "N/A"}
                      </p>
                      <p className="text-xs text-white/70">Cloud connection: {project.cloudConnectionId ?? "Not linked"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-white">PlayCanvas Export Artifacts</h2>
        <p className="mt-1 text-sm text-white/65">Upload exported ZIP files and reuse public deployment links.</p>

        <div className="mt-4">
          {artifactsLoading ? (
            <SkeletonGrid cards={1} />
          ) : artifactsError ? (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{artifactsError}</div>
          ) : artifacts.length === 0 ? (
            <EmptyState
              title="No PlayCanvas exports yet"
              description="Upload your first export ZIP to generate a reusable deployment URL for QA and sharing."
              cta={
                <label className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 text-sm font-bold text-white">
                  Upload first PlayCanvas export
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadArtifact(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              }
            />
          ) : (
            <div className="space-y-3">
              <div>
                <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white/90 hover:bg-white/10">
                  {isUploading ? "Uploading export…" : "Upload new export"}
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadArtifact(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              {artifacts.map((artifact) => (
                <div
                  key={artifact.buildId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div>
                    <p className="font-mono text-sm text-white">{artifact.buildId}</p>
                    <p className="text-xs text-white/65">
                      {new Date(artifact.createdAt).toLocaleString()} · {artifact.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      className="rounded-md border border-white/20 px-3 py-1.5 text-white/85 hover:bg-white/10"
                      onClick={async () => {
                        const deploymentUrl = new URL(artifact.publicPath, window.location.origin).toString();
                        await navigator.clipboard.writeText(deploymentUrl);
                        pushToast({ message: "Deployment URL copied.", tone: "success" });
                      }}
                    >
                      Copy URL
                    </button>
                    <a
                      href={artifact.publicPath}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                    >
                      Open deployment
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      <NpcPanel
        provider={npcProvider}
        onProviderError={(message) => {
          pushToast({ message, tone: "error" });
        }}
      />

      {!effectiveSceneId ? (
        <EmptyState
          title="Add a PlayCanvas scene ID"
          description="Select a saved project record or open this page with ?sceneId=<your-scene-id> to launch the embedded editor bridge."
          cta={null}
        />
      ) : (
        <div className="relative min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          {bridgeFailed ? (
            <div className="p-6">
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-6 py-8 text-center">
                <h3 className="text-lg font-bold text-white">Embed blocked — continue in PlayCanvas</h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-white/70">
                  The in-app PlayCanvas embed did not report readiness in time. Open the editor in a new tab to keep building.
                </p>
                <div className="mt-5"></div>
              </div>
            </div>
          ) : (
            <>
              {bridgeLoading ? (
                <div className="absolute inset-0 p-4">
                  <SkeletonGrid cards={2} />
                </div>
              ) : null}

              <PlayCanvasEditorHost
                sceneId={effectiveSceneId}
                onReady={() => {
                  setBridgeLoading(false);
                  setBridgeFailed(false);
                  pushToast({ message: "PlayCanvas editor connected.", tone: "success" });
                }}
                onError={() => {
                  setBridgeLoading(false);
                  setBridgeFailed(true);
                  pushToast({ message: "Could not embed editor. Continue in a new tab.", tone: "error" });
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
