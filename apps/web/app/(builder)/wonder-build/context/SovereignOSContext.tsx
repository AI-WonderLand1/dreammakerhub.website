'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { ConfessionEntry } from '../components/ConfessionsDrawer';

export const CONFESSIONS_STORAGE_KEY = 'sovereign_os:confessions';

export type BuildType = 'website' | 'game' | 'component' | 'playcanvas';
export type AgentStage = 'architect' | 'builder' | 'reviewer';
export type AgentStatus = 'idle' | 'running' | 'done' | 'error';
export type ActivePanel = 'editor' | 'playground' | 'ai-builder';

export interface AgentEvent {
  stage: AgentStage;
  status: AgentStatus;
  label: string;
  message: string;
  ts: number;
}

export interface BuildResult {
  type: BuildType;
  code: string;
  plan: string;
  timestamp: number;
}

interface SovereignOSState {
  activePanel: ActivePanel;
  setActivePanel: (p: ActivePanel) => void;

  playgroundPlaying: boolean;
  togglePlayground: () => void;

  buildType: BuildType;
  setBuildType: (t: BuildType) => void;
  prompt: string;
  setPrompt: (p: string) => void;

  agents: Partial<Record<AgentStage, AgentEvent>>;
  agentLog: AgentEvent[];
  result: BuildResult | null;
  error: string | null;
  running: boolean;

  editorCode: string;
  setEditorCode: (code: string) => void;

  editorIframeRef: React.RefObject<HTMLIFrameElement | null>;

  confessions: ConfessionEntry[];
  clearConfessions: () => void;

  runBuild: () => Promise<void>;
  stopBuild: () => void;
}

const SovereignOSContext = createContext<SovereignOSState | undefined>(undefined);

export const STAGE_ORDER: AgentStage[] = ['architect', 'builder', 'reviewer'];

export const STAGE_INFO: Record<AgentStage, { icon: string; label: string; color: string }> = {
  architect: { icon: '🏗️', label: 'Architect', color: 'violet' },
  builder:   { icon: '⚙️', label: 'Builder',   color: 'blue'   },
  reviewer:  { icon: '🔍', label: 'Reviewer',  color: 'green'  },
};

export function SovereignOSProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('ai-builder');
  const [playgroundPlaying, setPlaygroundPlaying] = useState(false);

  const [buildType, setBuildType] = useState<BuildType>('website');
  const [prompt, setPrompt] = useState('');
  const [agents, setAgents] = useState<Partial<Record<AgentStage, AgentEvent>>>({});
  const [agentLog, setAgentLog] = useState<AgentEvent[]>([]);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [editorCode, setEditorCode] = useState('');
  const [confessions, setConfessions] = useState<ConfessionEntry[]>([]);

  const clearConfessions = useCallback(() => setConfessions([]), []);

  useEffect(() => {
    try {
      localStorage.setItem(CONFESSIONS_STORAGE_KEY, JSON.stringify(confessions));
    } catch { /* storage unavailable */ }
  }, [confessions]);

  const abortRef = useRef<AbortController | null>(null);
  const editorIframeRef = useRef<HTMLIFrameElement | null>(null);

  const togglePlayground = useCallback(() => setPlaygroundPlaying((v) => !v), []);

  const stopBuild = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  const pushCodeToEditor = useCallback((code: string, type: BuildType) => {
    const iframe = editorIframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { command: 'wonder:inject', code, type },
      '*',
    );
  }, []);

  const runBuild = useCallback(async () => {
    if (!prompt.trim() || running) return;

    setRunning(true);
    setAgents({});
    setAgentLog([]);
    setResult(null);
    setError(null);
    setEditorCode('');
    setConfessions([]);
    setActivePanel('editor');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/build/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: buildType }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';

        for (const chunk of parts) {
          const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            const { event, data } = JSON.parse(dataLine.slice(6));
            if (event === 'agent') {
              const ev: AgentEvent = { ...data, ts: Date.now() };
              setAgents((prev) => ({ ...prev, [data.stage]: ev }));
              setAgentLog((prev) => [...prev, ev]);
              if (data.confession) {
                const c: ConfessionEntry = {
                  label: `${STAGE_INFO[data.stage as AgentStage]?.label ?? data.stage} — agent confession`,
                  text: typeof data.confession === 'string' ? data.confession : JSON.stringify(data.confession),
                  trustScore: data.trustScore != null ? Number(data.trustScore) : undefined,
                  workerId: data.workerId,
                  constitutionalCheck: data.constitutionalCheck,
                  at: new Date().toISOString(),
                };
                setConfessions((prev) => [...prev, c]);
              }
            } else if (event === 'result') {
              const built: BuildResult = {
                type: buildType,
                code: data.code,
                plan: data.plan ?? '',
                timestamp: Date.now(),
              };
              setResult(built);
              setEditorCode(data.code);
              pushCodeToEditor(data.code, buildType);
              if (data.confession) {
                const c: ConfessionEntry = {
                  label: 'Final build confession',
                  text: typeof data.confession === 'string' ? data.confession : JSON.stringify(data.confession),
                  trustScore: data.trustScore != null ? Number(data.trustScore) : undefined,
                  at: new Date().toISOString(),
                };
                setConfessions((prev) => [...prev, c]);
              }
              setAgentLog((prev) => [
                ...prev,
                {
                  stage: 'reviewer',
                  status: 'done',
                  label: '✅ Build complete',
                  message: `${(data.code.length / 1024).toFixed(1)} KB streamed into editor`,
                  ts: Date.now(),
                },
              ]);
            } else if (event === 'confession') {
              const c: ConfessionEntry = {
                label: data.label ?? 'AI Confession',
                text: typeof data.text === 'string' ? data.text : JSON.stringify(data),
                trustScore: data.trustScore != null ? Number(data.trustScore) : undefined,
                workerId: data.workerId,
                constitutionalCheck: data.constitutionalCheck,
                at: data.at ?? new Date().toISOString(),
              };
              setConfessions((prev) => [...prev, c]);
            } else if (event === 'error') {
              setError(data.message ?? 'Unknown error');
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message ?? 'Build failed');
    } finally {
      setRunning(false);
    }
  }, [prompt, buildType, running, pushCodeToEditor]);

  return (
    <SovereignOSContext.Provider
      value={{
        activePanel, setActivePanel,
        playgroundPlaying, togglePlayground,
        buildType, setBuildType,
        prompt, setPrompt,
        agents, agentLog,
        result, error, running,
        editorCode, setEditorCode,
        editorIframeRef,
        confessions, clearConfessions,
        runBuild, stopBuild,
      }}
    >
      {children}
    </SovereignOSContext.Provider>
  );
}

export function useSovereignOS() {
  const ctx = useContext(SovereignOSContext);
  if (!ctx) throw new Error('useSovereignOS must be used inside SovereignOSProvider');
  return ctx;
}
