'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileTree, FileNode, buildTree } from '@/components/file-manager/FileTree';
import { CodeEditor } from '@/components/file-manager/CodeEditor';
import { FileManagerToolbar } from '@/components/file-manager/FileManagerToolbar';
import { BreadcrumbBar } from '@/components/file-manager/BreadcrumbBar';
import { ImportModal } from '@/components/file-manager/ImportModal';
import { broadcastFileEvent } from '@/lib/realtime/events';

export default function FileManagerPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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
      broadcastFileEvent(projectId, { type: 'file:save', message: `saved ${selectedPath}` });
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
      broadcastFileEvent(projectId, { type: 'file:create', message: `created ${path}` });
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
      setFiles((prev) => {
        const next: Record<string, string> = {};
        for (const [key, value] of Object.entries(prev)) {
          if (key === oldPath || key.startsWith(`${oldPath}/`)) {
            next[`${newPath}${key.slice(oldPath.length)}`] = value;
          } else {
            next[key] = value;
          }
        }
        return next;
      });
      if (selectedPath === oldPath || selectedPath?.startsWith(`${oldPath}/`)) {
        setSelectedPath(`${newPath}${(selectedPath || '').slice(oldPath.length)}`);
      }
      broadcastFileEvent(projectId, { type: 'file:rename', message: `renamed ${oldPath} → ${newPath}` });
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
        const next: Record<string, string> = {};
        for (const [key, value] of Object.entries(prev)) {
          if (key === path || key.startsWith(`${path}/`)) continue;
          next[key] = value;
        }
        return next;
      });
      if (selectedPath === path || selectedPath?.startsWith(`${path}/`)) {
        setSelectedPath(null);
        setFileContent('');
      }
      broadcastFileEvent(projectId, { type: 'file:delete', message: `deleted ${path}` });
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleImport = async (imported: Record<string, string>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: imported }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Import failed');
      }
      setFiles((prev) => ({ ...prev, ...imported }));
      broadcastFileEvent(projectId, {
        type: 'file:import',
        message: `imported ${Object.keys(imported).length} file${Object.keys(imported).length === 1 ? '' : 's'}`,
      });
    } catch (err: any) {
      alert(err?.message || 'Import failed');
    }
  };

  const handleDownloadZip = () => {
    window.location.href = `/api/projects/${projectId}/export?format=zip`;
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
          onImport={() => setImportOpen(true)}
          onDownloadZip={handleDownloadZip}
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

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
