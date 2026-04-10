'use client';

import { useEffect, useState, useCallback } from 'react';
import { Code2, Loader2, ExternalLink, Play, Monitor } from 'lucide-react';

interface CoderIDEEngineProps {
  engineState?: any;
  onStateChange?: (state: any) => void;
}

type WorkspaceStatus = 'idle' | 'provisioning' | 'running' | 'stopped' | 'error';

interface WorkspaceUrls {
  ide: string;
  playcanvas: string;
  webglStudio: string;
}

export default function CoderIDEEngine({ engineState, onStateChange }: CoderIDEEngineProps) {
  const [loading, setLoading] = useState(true);
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>('idle');
  const [workspaceUrls, setWorkspaceUrls] = useState<WorkspaceUrls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'ide' | 'playcanvas' | 'webgl'>('ide');

  const workspaceId = engineState?.workspaceId || engineState?.workspace || null;

  const fetchWorkspaceStatus = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/environments?id=${workspaceId}`, {
        headers: {
          Authorization: `Bearer ${engineState?.token || ''}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch workspace status');
      }

      const data = await res.json();
      const env = data.environment;
      const ws = data.workspace;

      if (ws) {
        setWorkspaceUrls({
          ide: ws.url,
          playcanvas: ws.playcanvasUrl,
          webglStudio: ws.webglStudioUrl,
        });
        setWorkspaceStatus(ws.status as WorkspaceStatus);
      } else if (env) {
        const baseUrl = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || '';
        if (baseUrl) {
          const id = env.id;
          setWorkspaceUrls({
            ide: `https://${id}.${baseUrl}`,
            playcanvas: `https://pc-${id}.${baseUrl}`,
            webglStudio: `https://ws-${id}.${baseUrl}`,
          });
        }
        setWorkspaceStatus(env.status as WorkspaceStatus);
      }

      onStateChange?.({
        ...engineState,
        workspaceStatus: workspaceStatus,
        urls: workspaceUrls,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, engineState, onStateChange, workspaceStatus, workspaceUrls]);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceStatus();
    } else {
      setLoading(false);
    }
  }, [workspaceId]);

  const provisionWorkspace = async () => {
    if (!engineState?.projectId && !workspaceId) return;

    setWorkspaceStatus('provisioning');
    setError(null);

    try {
      const res = await fetch('/api/environments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${engineState?.token || ''}`,
        },
        body: JSON.stringify({
          projectId: engineState?.projectId,
          name: engineState?.workspaceName || 'my-workspace',
          type: 'full',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to provision workspace');
      }

      const data = await res.json();
      if (data.url) {
        setWorkspaceUrls({
          ide: data.url,
          playcanvas: data.playcanvasUrl,
          webglStudio: data.webglStudioUrl,
        });
      }
      setWorkspaceStatus(data.status || 'running');

      onStateChange?.({
        ...engineState,
        workspaceStatus: data.status || 'running',
        urls: {
          ide: data.url,
          playcanvas: data.playcanvasUrl,
          webglStudio: data.webglStudioUrl,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provisioning failed');
      setWorkspaceStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a10]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-white/60">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (workspaceStatus === 'idle' && !workspaceId) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a10]">
        <div className="text-center max-w-md">
          <Code2 className="mx-auto h-16 w-16 text-violet-400/50 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Cloud IDE Workspace</h2>
          <p className="text-sm text-white/50 mb-6">
            Create an isolated cloud development environment with your own code editor,
            PlayCanvas 3D engine, and WebGL Studio — all running in your personal container.
          </p>
          <button
            onClick={provisionWorkspace}
            className="px-6 py-3 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-semibold transition"
          >
            Create Workspace
          </button>
        </div>
      </div>
    );
  }

  if (workspaceStatus === 'provisioning') {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a10]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/80 font-medium">Provisioning your workspace...</p>
          <p className="text-white/40 text-sm">Setting up code-server, PlayCanvas, and WebGL Studio</p>
          <div className="flex gap-4 mt-2 text-xs text-white/30">
            <span>IDE: Starting...</span>
            <span>PlayCanvas: Queued</span>
            <span>WebGL Studio: Queued</span>
          </div>
        </div>
      </div>
    );
  }

  if (workspaceStatus === 'error' || error) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a10]">
        <div className="text-center max-w-md">
          <Code2 className="mx-auto h-16 w-16 text-red-400/50 mb-4" />
          <h2 className="text-xl font-bold text-red-300 mb-2">Workspace Error</h2>
          <p className="text-sm text-white/50 mb-4">{error || 'Failed to start workspace'}</p>
          <button
            onClick={provisionWorkspace}
            className="px-6 py-3 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentUrl = activeView === 'ide'
    ? workspaceUrls?.ide
    : activeView === 'playcanvas'
    ? workspaceUrls?.playcanvas
    : workspaceUrls?.webglStudio;

  return (
    <div className="flex h-full flex-col bg-[#0a0a10]">
      {/* Workspace tab bar */}
      <div className="flex items-center gap-1 border-b border-white/10 bg-black/60 px-2 py-1">
        <button
          onClick={() => setActiveView('ide')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
            activeView === 'ide' ? 'bg-violet-500/30 text-violet-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          IDE
        </button>
        <button
          onClick={() => setActiveView('playcanvas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
            activeView === 'playcanvas' ? 'bg-blue-500/30 text-blue-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          PlayCanvas
        </button>
        <button
          onClick={() => setActiveView('webgl')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
            activeView === 'webgl' ? 'bg-green-500/30 text-green-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Monitor className="h-3.5 w-3.5" />
          WebGL Studio
        </button>
        <div className="flex-1" />
        {currentUrl && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/40 hover:text-white/80 transition"
          >
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </a>
        )}
        <span className="text-xs text-white/30 ml-2">
          {workspaceStatus === 'running' ? '● Live' : '○ Offline'}
        </span>
      </div>

      {/* Workspace content */}
      <div className="flex-1">
        {currentUrl && workspaceStatus === 'running' ? (
          <iframe
            key={currentUrl}
            src={currentUrl}
            className="h-full w-full border-0"
            allow="clipboard-read; clipboard-write; cross-origin-isolated"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            title={`${activeView} Workspace`}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Code2 className="mx-auto h-12 w-12 text-white/20" />
              <p className="mt-4 text-white/60">Workspace not running</p>
              <p className="text-sm text-white/40">
                Start your workspace to access the IDE, PlayCanvas, and WebGL Studio
              </p>
              <button
                onClick={provisionWorkspace}
                className="mt-4 px-4 py-2 rounded bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium transition"
              >
                Start Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}