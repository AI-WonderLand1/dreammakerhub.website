'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileTree, FileNode, buildTree } from '@/components/file-manager/FileTree';
import { CodeEditor } from '@/components/file-manager/CodeEditor';
import { FileManagerToolbar } from '@/components/file-manager/FileManagerToolbar';
import { BreadcrumbBar } from '@/components/file-manager/BreadcrumbBar';

export default function FileManagerPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filePaths = Object.keys(files);

  const handleSelect = (path: string) => {
    setSelectedPath(path);
    setFileContent(files[path] || '');
  };

  const handleSave = async () => {
    if (!selectedPath) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: { [selectedPath]: fileContent } }),
      });
      setFiles((prev) => ({ ...prev, [selectedPath]: fileContent }));
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleNewFile = async (dirPath?: string) => {
    const name = prompt('File name:');
    if (!name) return;
    const path = dirPath ? `${dirPath}/${name}` : name;
    try {
      await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: { [path]: '' } }),
      });
      setFiles((prev) => ({ ...prev, [path]: '' }));
      setSelectedPath(path);
      setFileContent('');
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  const handleNewFolder = async (dirPath?: string) => {
    const name = prompt('Folder name:');
    if (!name) return;
    const path = dirPath ? `${dirPath}/${name}` : name;
    const placeholder = `${path}/.gitkeep`;
    try {
      await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: { [placeholder]: '' } }),
      });
      setFiles((prev) => ({ ...prev, [placeholder]: '' }));
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleRename = async (oldPath: string, newPath: string) => {
    try {
      await fetch(`/api/projects/${projectId}/files/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath }),
      });
      const content = files[oldPath] || '';
      setFiles((prev) => {
        const next = { ...prev };
        delete next[oldPath];
        next[newPath] = content;
        return next;
      });
      if (selectedPath === oldPath) {
        setSelectedPath(newPath);
      }
    } catch (err) {
      console.error('Failed to rename:', err);
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    try {
      await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });
      setFiles((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
      if (selectedPath === path) {
        setSelectedPath(null);
        setFileContent('');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-white/40">Loading files...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: File Tree */}
      <div className="w-64 flex-shrink-0 border-r border-white/10 bg-[#0a0e1a]">
        <FileManagerToolbar
          onNewFile={() => handleNewFile()}
          onNewFolder={() => handleNewFolder()}
          onDeleteSelected={() => selectedPath && handleDelete(selectedPath)}
          selectedPath={selectedPath}
        />
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 37px)' }}>
          <FileTree
            files={buildTree(filePaths)}
            selectedPath={selectedPath}
            onSelect={handleSelect}
            onRename={handleRename}
            onDelete={handleDelete}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
          />
        </div>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        <BreadcrumbBar path={selectedPath} onNavigate={handleSelect} />
        <div className="flex-1">
          {selectedPath ? (
            <CodeEditor
              filePath={selectedPath}
              content={fileContent}
              onChange={setFileContent}
              onSave={handleSave}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-white/40">Select a file to edit</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
