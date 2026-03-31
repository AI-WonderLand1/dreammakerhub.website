'use client';

import { useCallback, useMemo, useState } from 'react';
import PlayCanvasEngine from '../PlayCanvasEngine';

type UnrealWonderBuildPageProps = {
  assetUrl?: string;
  sceneId?: string;
  projectId?: string;
};

type OrchestrateResponse = {
  sceneUrl: string;
  projectId: string;
  sceneId: string;
  jobId: string;
};

function buildEditorUrl(sceneId?: string) {
  const trimmed = sceneId?.trim() ?? '';
  if (!trimmed) {
    return '/webglstudio/webglstudio.js-master/editor/index.html';
  }
  return `/webglstudio/webglstudio.js-master/editor/index.html?sceneId=${encodeURIComponent(trimmed)}`;
}

export function UnrealWonderBuildPage({ assetUrl, sceneId, projectId }: UnrealWonderBuildPageProps) {
  const trimmedProjectId = projectId?.trim() ?? '';
  const hasProjectId = Boolean(trimmedProjectId);
  const hasSceneId = Boolean(sceneId?.trim());
  const editorUrl = useMemo(() => buildEditorUrl(sceneId), [sceneId]);
  const [orchestrateError, setOrchestrateError] = useState<string | null>(null);
  const [orchestrateResult, setOrchestrateResult] = useState<OrchestrateResponse | null>(null);
  const [isOrchestrating, setIsOrchestrating] = useState(false);

  const handleOrchestrate = useCallback(async () => {
    if (!hasProjectId) {
      setOrchestrateResult(null);
      setOrchestrateError('Missing projectId. Add ?projectId=<id> to enable pipeline orchestration.');
      return;
    }

    setIsOrchestrating(true);
    setOrchestrateError(null);
    setOrchestrateResult(null);

    try {
      const response = await fetch('/api/unreal-wonder-build/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: trimmedProjectId,
          sceneId: sceneId?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const fallbackMessage = `Pipeline trigger failed (${response.status}).`;
        const body = (await response.text()).trim();
        setOrchestrateError(body || fallbackMessage);
        return;
      }

      const payload: OrchestrateResponse = await response.json();
      setOrchestrateResult(payload);
    } catch (error) {
      setOrchestrateError(error instanceof Error ? error.message : 'Pipeline trigger failed unexpectedly.');
    } finally {
      setIsOrchestrating(false);
    }
  }, [hasProjectId, sceneId, trimmedProjectId]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80">
        <p className="font-semibold text-white">Inner 3D World</p>
        <p className="mt-1 text-white/70">
          This runtime is intentionally isolated from Puck. Use Puck for high-level layout composition and
          mount PlayCanvas here as a sibling route surface.
        </p>
      </div>

      <PlayCanvasEngine assetUrl={assetUrl} />

      <section className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Editor Access</h2>
          <span className="text-xs text-white/60">
            {hasSceneId ? `Scene: ${sceneId}` : 'Add ?sceneId=<id> to open a specific editor scene.'}
          </span>
        </div>

        <p className="mt-3 text-sm text-white/70">
          Use your local WebGLStudio editor from the public folder in a new tab.
        </p>

        <div className="mt-3">
          <a
            href={editorUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white/90 hover:bg-white/15"
          >
            Open WebGLStudio
          </a>
          <button
            type="button"
            onClick={handleOrchestrate}
            disabled={!hasProjectId || isOrchestrating}
            className="ml-3 inline-flex h-10 items-center rounded-lg border border-white/20 bg-indigo-500/30 px-4 text-sm font-semibold text-white/90 hover:bg-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOrchestrating ? 'Triggering…' : 'Trigger Scene Pipeline'}
          </button>
        </div>

        {!hasProjectId ? (
          <p className="mt-3 text-xs text-amber-300">Add ?projectId=&lt;id&gt; to enable the pipeline action.</p>
        ) : null}

        {orchestrateError ? <p className="mt-3 text-sm text-red-300">{orchestrateError}</p> : null}

        {orchestrateResult ? (
          <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
            <p className="font-semibold">Scene pipeline complete.</p>
            <p className="mt-1">Job: {orchestrateResult.jobId}</p>
            <a href={orchestrateResult.sceneUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block underline">
              Open final scene URL
            </a>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default UnrealWonderBuildPage;
