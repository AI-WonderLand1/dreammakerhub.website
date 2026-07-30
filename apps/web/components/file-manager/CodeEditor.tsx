'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm': return 'html';
    case 'css': return 'css';
    case 'js':
    case 'jsx': return 'javascript';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'svg': return 'xml';
    case 'py': return 'python';
    case 'rb': return 'ruby';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'yaml':
    case 'yml': return 'yaml';
    case 'toml': return 'toml';
    case 'sql': return 'sql';
    case 'sh':
    case 'bash': return 'shell';
    case 'xml': return 'xml';
    default: return 'plaintext';
  }
}

interface CodeEditorProps {
  filePath: string;
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function CodeEditor({ filePath, content, onChange, onSave }: CodeEditorProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    onSave();
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-xs text-white/50">{filePath}</span>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[10px] text-green-400">Saved</span>}
          <button
            onClick={handleSave}
            className="rounded px-2 py-0.5 text-[10px] text-white/50 hover:bg-white/10 hover:text-white"
          >
            Ctrl+S
          </button>
        </div>
      </div>
      <div className="flex-1">
        <MonacoEditor
          language={getLanguage(filePath)}
          value={content}
          onChange={(val) => onChange(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 8 },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
