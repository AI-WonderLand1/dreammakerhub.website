import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: string;
  height?: string | number;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

export default function MonacoEditor({
  value,
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px',
  options = {}
}: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;

    // Configure Monaco
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
        'editor.background': '#0a0014',
        'editor.foreground': '#ffffff',
        'editor.lineHighlightBackground': '#1a0030',
        'editor.selectionBackground': '#264f78',
      }
    });

    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      ...options
    });
  };

  const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    ...options
  };

  return (
    <div className="w-full h-full">
      <Editor
        height={height}
        language={language}
        value={value}
        theme={theme === 'vs-dark' ? 'wonderland-dark' : theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={defaultOptions}
        loading={<div className="flex items-center justify-center h-full text-gray-400">Loading editor...</div>}
      />
    </div>
  );
}