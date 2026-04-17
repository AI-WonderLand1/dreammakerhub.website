'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { WebContainerManager, TerminalEmulator, WebContainerPersistence, type FileNode } from '../../../packages/ide-engine/src';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-context';
import '@xterm/xterm/css/xterm.css';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const wcManager = new WebContainerManager();

interface AgentAction {
  id: string;
  label: string;
  cost: number;
  unit: string;
}

interface CodeAnnotation {
  line: number;
  text: string;
  docUrl?: string;
  type: 'why' | 'warning' | 'info';
}

const AGENT_ACTIONS: AgentAction[] = [
  { id: 'codegen', label: 'Code Generation', cost: 0.03, unit: 'per 1K tokens' },
  { id: 'debug', label: 'Debug & Fix', cost: 0.05, unit: 'per request' },
  { id: 'refactor', label: 'Refactor', cost: 0.04, unit: 'per 1K tokens' },
  { id: 'explain', label: 'Explain Code', cost: 0.02, unit: 'per request' },
  { id: 'test-gen', label: 'Generate Tests', cost: 0.03, unit: 'per request' },
  { id: 'deploy', label: 'Deploy Runner', cost: 0.10, unit: 'per deploy' },
];

function getLanguageFromPath(path: string): string {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.md')) return 'markdown';
  if (path.endsWith('.py')) return 'python';
  return 'plaintext';
}

export default function WonderSpaceIDE() {
  const { user } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const termEmulator = useRef<TerminalEmulator | null>(null);
  const persistence = useRef<WebContainerPersistence | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const [booted, setBooted] = useState(false);
  const [booting, setBooting] = useState(false);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string>('server.js');
  const [fileContent, setFileContent] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loadedFromCloud, setLoadedFromCloud] = useState(false);

  const [showCredits, setShowCredits] = useState(false);
  const [credits, setCredits] = useState(25.0);
  const [usageHistory, setUsageHistory] = useState<{ action: string; cost: number; time: string }[]>([]);

  const [annotations, setAnnotations] = useState<CodeAnnotation[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [explainingCode, setExplainingCode] = useState(false);

  const deductCredits = useCallback((action: string, cost: number) => {
    if (credits < cost) {
      alert('Insufficient credits. Please add more.');
      return false;
    }
    setCredits((prev) => Math.round((prev - cost) * 100) / 100);
    setUsageHistory((prev) => [{ action, cost, time: new Date().toLocaleTimeString() }, ...prev]);
    return true;
  }, [credits]);

  const refreshFileTree = useCallback(async () => {
    if (!wcManager.isReady()) return;
    const tree = await wcManager.getFileTree();
    setFileTree(tree);
  }, []);

  const openFile = useCallback(async (filePath: string) => {
    if (!wcManager.isReady()) return;
    try {
      const content = await wcManager.readFile(filePath);
      setActiveFile(filePath);
      setFileContent(content);
      setAnnotations([]);
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  }, []);

  const saveToCloud = useCallback(async () => {
    if (!persistence.current || !wcManager.isReady()) return;
    setSaveStatus('saving');
    try {
      await persistence.current.saveSnapshot(wcManager.getInstance());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  const saveFile = useCallback(async () => {
    if (!wcManager.isReady() || !activeFile) return;
    try {
      await wcManager.writeFile(activeFile, fileContent);
      await refreshFileTree();
      if (persistence.current) {
        persistence.current.scheduleSave(wcManager.getInstance());
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [activeFile, fileContent, refreshFileTree]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('wonderland-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
      }
    });

    monaco.editor.setTheme('wonderland-dark');

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile();
    });
  }, [saveFile]);

  // Apply Why Highlighter decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const decorations = annotations.map((ann) => ({
      range: new monaco.Range(ann.line, 1, ann.line, 1),
      options: {
        isWholeLine: true,
        className: ann.type === 'why' ? 'why-highlight-line' : ann.type === 'warning' ? 'warning-highlight-line' : 'info-highlight-line',
        glyphMarginClassName: ann.type === 'why' ? 'why-glyph' : ann.type === 'warning' ? 'warning-glyph' : 'info-glyph',
        hoverMessage: { value: `**${ann.type.toUpperCase()}**: ${ann.text}${ann.docUrl ? `\n\n[Docs](${ann.docUrl})` : ''}` },
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, [annotations]);

  const handleExplainCode = useCallback(async () => {
    if (!fileContent.trim() || !deductCredits('Explain Code', 0.02)) return;
    setExplainingCode(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'builder',
          command: `Explain each significant line of this code. Return a JSON array of objects with "line" (1-indexed line number), "text" (brief explanation of why this line exists), and optional "docUrl" (relevant documentation URL). Code:\n\n${fileContent.slice(0, 4000)}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        try {
          const parsed = JSON.parse(data.answer);
          if (Array.isArray(parsed)) {
            setAnnotations(parsed.map((a: any) => ({
              line: a.line,
              text: a.text,
              docUrl: a.docUrl,
              type: 'why' as const,
            })));
            setShowAnnotations(true);
          }
        } catch {
          // If not JSON, show the explanation as a single annotation on line 1
          setAnnotations([{ line: 1, text: data.answer, type: 'why' }]);
          setShowAnnotations(true);
        }
      }
    } catch (err) {
      console.error('Explain failed:', err);
    } finally {
      setExplainingCode(false);
    }
  }, [fileContent, deductCredits]);

  useEffect(() => {
    if (terminalRef.current && !termEmulator.current) {
      termEmulator.current = new TerminalEmulator();
      termEmulator.current.create(terminalRef.current);
    }

    if (booting || booted) return;
    setBooting(true);

    wcManager
      .boot()
      .then(async (wc) => {
        const supabase = createClient();
        if (supabase && user?.id) {
          persistence.current = new WebContainerPersistence(supabase, user.id);

          const snapshot = await persistence.current.loadSnapshot();
          if (snapshot && Object.keys(snapshot.files).length > 0) {
            const tree = persistence.current.snapshotToTree(snapshot);
            await wcManager.mountProject(tree);
            setLoadedFromCloud(true);
          } else {
            await wcManager.mountProject();
          }
        } else {
          await wcManager.mountProject();
        }

        wcManager.onServerReady((_port, url) => {
          setPreviewUrl(url);
        });

        if (termEmulator.current) {
          await termEmulator.current.attachShell(async () => {
            return wcManager.spawn('jsh', []);
          });
        }

        await refreshFileTree();
        await openFile('server.js');

        setBooted(true);
        setBooting(false);
      })
      .catch((err) => {
        console.error('Failed to boot WebContainer:', err);
        setBooting(false);
      });

    return () => {
      termEmulator.current?.dispose();
      termEmulator.current = null;
      persistence.current?.destroy();
      persistence.current = null;
    };
  }, [booted, booting, refreshFileTree, openFile, user?.id]);

  const handleInstallAndRun = useCallback(async () => {
    if (!wcManager.isReady()) return;
    if (!deductCredits('Runner: npm start', 0.01)) return;
    setRunning(true);
    const install = await wcManager.spawn('npm', ['install']);
    const code = await install.exit;
    if (code === 0) {
      const dev = await wcManager.spawn('npm', ['run', 'dev']);
      dev.exit.then(() => setRunning(false));
    } else {
      setRunning(false);
    }
  }, [deductCredits]);

  const handleNewFile = useCallback(async () => {
    if (!wcManager.isReady()) return;
    const name = prompt('File name (e.g. app.js):');
    if (!name) return;
    await wcManager.writeFile(name, '');
    await refreshFileTree();
    await openFile(name);
  }, [refreshFileTree, openFile]);

  const handleAgentAction = useCallback((action: AgentAction) => {
    if (!deductCredits(action.label, action.cost)) return;
    alert(`${action.label} triggered! (In production: connects to WonderAI pipeline)`);
  }, [deductCredits]);

  const renderFileTree = (nodes: FileNode[], depth = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    for (const node of nodes) {
      if (node.type === 'directory') {
        result.push(
          <div key={node.name}>
            <div
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#21262d] rounded cursor-pointer text-sm"
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              <span className="text-yellow-400 text-xs">📁</span>
              <span className="text-gray-300">{node.name}</span>
            </div>
            {node.children && renderFileTree(node.children, depth + 1)}
          </div>
        );
      } else {
        const filePath = node.name;
        result.push(
          <div
            key={node.name}
            onClick={() => openFile(filePath)}
            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-[#21262d] rounded cursor-pointer text-sm ${
              activeFile === filePath ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400'
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <span className="text-xs">
              {node.name.endsWith('.js') ? '📄' : node.name.endsWith('.json') ? '📋' : node.name.endsWith('.md') ? '📝' : node.name.endsWith('.html') ? '🌐' : '📄'}
            </span>
            <span>{node.name}</span>
          </div>
        );
      }
    }
    return result;
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      <style jsx global>{`
        .why-highlight-line { background: rgba(139, 92, 246, 0.08) !important; border-left: 3px solid #8b5cf6; }
        .warning-highlight-line { background: rgba(245, 158, 11, 0.08) !important; border-left: 3px solid #f59e0b; }
        .info-highlight-line { background: rgba(59, 130, 246, 0.08) !important; border-left: 3px solid #3b82f6; }
        .why-glyph::before { content: '💡'; font-size: 12px; }
        .warning-glyph::before { content: '⚠️'; font-size: 12px; }
        .info-glyph::before { content: 'ℹ️'; font-size: 12px; }
      `}</style>

      {/* Header */}
      <header className="h-12 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm" title="Back to Dashboard">
            ← Dashboard
          </Link>
          <div className="h-4 w-px bg-[#30363d]" />
          <img src="/images/logo.png" alt="WonderSpace" className="h-6 w-auto" />
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            WonderSpace IDE
          </span>
          {booted && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">READY</span>
          )}
          {booting && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded animate-pulse">
              BOOTING...
            </span>
          )}
          {loadedFromCloud && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
              Loaded from cloud
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-xs text-yellow-400 animate-pulse">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-400">Saved to cloud</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-400">Save failed</span>
          )}

          <button
            onClick={() => setShowCredits(!showCredits)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-xs font-medium transition"
          >
            <span className="text-yellow-400">✦</span>
            <span className={credits < 5 ? 'text-red-400' : 'text-green-400'}>${credits.toFixed(2)}</span>
          </button>

          <button
            onClick={handleNewFile}
            disabled={!booted}
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-xs font-medium transition disabled:opacity-50"
          >
            + New File
          </button>
          <button
            onClick={saveFile}
            disabled={!booted || !activeFile}
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-xs font-medium transition disabled:opacity-50"
          >
            💾 Save
          </button>
          <button
            onClick={saveToCloud}
            disabled={!booted || !user}
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-xs font-medium transition disabled:opacity-50"
            title="Force save all files to cloud"
          >
            ☁️ Sync
          </button>
          <button
            onClick={handleExplainCode}
            disabled={!booted || !activeFile || explainingCode}
            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-xs font-medium text-purple-300 transition disabled:opacity-50"
            title="AI explains each line of the current file"
          >
            {explainingCode ? '⏳ Explaining...' : '💡 Why?'}
          </button>
          <button
            onClick={handleInstallAndRun}
            disabled={!booted || running}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition disabled:opacity-50"
          >
            ▶️ Run
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <aside className="w-56 border-r border-[#30363d] bg-[#161b22] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explorer</span>
            <button
              onClick={handleNewFile}
              disabled={!booted}
              className="text-gray-500 hover:text-white text-sm disabled:opacity-50"
            >
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1 text-sm">
            {booted ? renderFileTree(fileTree) : (
              <div className="p-3 text-xs text-gray-500 animate-pulse">Loading files...</div>
            )}
          </div>
        </aside>

        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center px-2 gap-1 shrink-0">
            {activeFile && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#0d1117] border border-[#30363d] rounded-t text-xs">
                <span className="text-gray-400">{activeFile}</span>
                <button
                  onClick={() => setActiveFile('')}
                  className="text-gray-600 hover:text-white ml-1"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="flex-1 relative overflow-hidden">
            {activeFile ? (
              <MonacoEditor
                height="100%"
                language={getLanguageFromPath(activeFile)}
                value={fileContent}
                onChange={(value) => setFileContent(value || '')}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  glyphMargin: true,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                }}
                loading={<div className="flex items-center justify-center h-full text-gray-400">Loading editor...</div>}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                Select a file to edit
              </div>
            )}
          </div>

          {/* Terminal */}
          <div className="h-56 border-t border-[#30363d] bg-[#0d1117] flex flex-col shrink-0">
            <div className="h-8 bg-[#161b22] border-b border-[#30363d] flex items-center px-3 shrink-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Terminal</span>
              <div className="ml-auto flex gap-2">
                {running && (
                  <span className="text-xs text-yellow-400 animate-pulse">Running...</span>
                )}
              </div>
            </div>
            <div ref={terminalRef} className="flex-1 p-1 overflow-hidden" />
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-80 border-l border-[#30363d] bg-[#161b22] flex flex-col shrink-0">
          {/* Why Highlighter Panel */}
          {showAnnotations && annotations.length > 0 && (
            <div className="border-b border-[#30363d]">
              <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Why? Explanations</span>
                <button
                  onClick={() => setShowAnnotations(false)}
                  className="text-gray-500 hover:text-white text-xs"
                >
                  ×
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                {annotations.map((ann, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2"
                  >
                    <p className="text-[10px] text-purple-300 font-mono">Line {ann.line}</p>
                    <p className="text-xs text-white/60 mt-0.5">{ann.text}</p>
                    {ann.docUrl && (
                      <a
                        href={ann.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-purple-400 hover:text-purple-300 mt-1 inline-block"
                      >
                        View docs →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Agents Panel */}
          <div className="border-b border-[#30363d]">
            <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Agents</span>
              <span className="text-xs text-yellow-400">✦ Pay per use</span>
            </div>
            <div className="p-2 space-y-1">
              {AGENT_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAgentAction(action)}
                  disabled={credits < action.cost}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#21262d] rounded text-xs transition disabled:opacity-40"
                >
                  <span className="text-gray-300">{action.label}</span>
                  <span className="text-yellow-400">${action.cost} <span className="text-gray-600">{action.unit}</span></span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="h-8 border-b border-[#30363d] flex items-center px-3 shrink-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview</span>
                <button
                  onClick={() => {
                    if (previewRef.current) previewRef.current.src = previewUrl;
                  }}
                  className="ml-auto text-gray-500 hover:text-white text-xs"
                >
                  ↻
                </button>
              </div>
              <iframe
                ref={previewRef}
                src={previewUrl}
                className="flex-1 w-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                title="Preview"
              />
            </div>
          )}
        </aside>
      </div>

      {/* Credits Panel */}
      {showCredits && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCredits(false); }}
        >
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Credits & Billing</h2>

            <div className="p-4 bg-[#21262d] rounded-lg mb-4">
              <p className="text-xs text-gray-400">Current Balance</p>
              <p className={`text-2xl font-bold ${credits < 5 ? 'text-red-400' : 'text-green-400'}`}>
                ${credits.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Add Credits</p>
              <div className="flex gap-2">
                {[5, 10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCredits((prev) => Math.round((prev + amount) * 100) / 100)}
                    className="flex-1 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-sm font-medium transition"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Pricing</p>
              <div className="space-y-1">
                {AGENT_ACTIONS.map((action) => (
                  <div key={action.id} className="flex justify-between text-xs px-2 py-1">
                    <span className="text-gray-400">{action.label}</span>
                    <span className="text-yellow-400">${action.cost} {action.unit}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs px-2 py-1">
                  <span className="text-gray-400">Runner: npm start</span>
                  <span className="text-yellow-400">$0.01 per run</span>
                </div>
                <div className="flex justify-between text-xs px-2 py-1">
                  <span className="text-gray-400">WebContainer Session</span>
                  <span className="text-yellow-400">$0.02 per hour</span>
                </div>
              </div>
            </div>

            {usageHistory.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Recent Usage</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {usageHistory.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs px-2 py-1">
                      <span className="text-gray-400">{item.action}</span>
                      <span className="text-red-400">-${item.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCredits(false)}
              className="w-full py-2 border border-[#30363d] hover:bg-[#21262d] rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
