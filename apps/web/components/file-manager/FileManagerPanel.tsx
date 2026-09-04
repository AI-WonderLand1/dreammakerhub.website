'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Folder, FolderOpen, Plus, Trash2, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

interface FileManagerPanelProps {
  projectId?: string;
}

function toFileTree(paths: string[]): FileItem[] {
  type Node = { name: string; path: string; type: 'file' | 'directory'; children: Map<string, Node> };
  const root = new Map<string, Node>();

  for (const rawPath of paths) {
    const cleanPath = rawPath.replace(/^\/+/, '');
    if (!cleanPath) continue;
    const parts = cleanPath.split('/').filter(Boolean);
    let level = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      let node = level.get(part);
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          children: new Map(),
        };
        level.set(part, node);
      } else if (!isFile) {
        node.type = 'directory';
      }
      level = node.children;
    });
  }

  const serialize = (nodes: Map<string, Node>): FileItem[] =>
    [...nodes.values()]
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => ({
        name: node.name,
        path: node.path,
        type: node.type,
        children: node.type === 'directory' ? serialize(node.children) : undefined,
      }));

  return serialize(root);
}

export default function FileManagerPanel({ projectId }: FileManagerPanelProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const loadFiles = useCallback(async () => {
    if (!projectId) {
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`);
      if (res.ok) {
        const data = await res.json();
        const record = data?.files && typeof data.files === 'object' ? data.files as Record<string, string> : {};
        setFiles(toFileTree(Object.keys(record)));
      }
    } catch (err) {
      logger.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const createFile = async () => {
    const name = window.prompt('File name (for example: assets/notes.txt):')?.trim();
    if (!name || !projectId) return;
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: { [name]: '' } }),
      });
      if (!response.ok) throw new Error('Create file failed');
      await loadFiles();
    } catch (err) {
      logger.error('Failed to create file:', err);
    }
  };

  const deleteFile = async (path: string) => {
    if (!projectId || !window.confirm(`Delete ${path}?`)) return;
    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/files?path=${encodeURIComponent(path)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) throw new Error('Delete file failed');
      await loadFiles();
    } catch (err) {
      logger.error('Failed to delete file:', err);
    }
  };

  const renderTree = (items: FileItem[], depth = 0): React.ReactNode =>
    items.map((item) => (
      <div key={item.path}>
        <div
          className="group flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/5"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => item.type === 'directory' ? toggleDir(item.path) : undefined}
        >
          {item.type === 'directory' ? (
            expandedDirs.has(item.path) ? <FolderOpen size={12} /> : <Folder size={12} />
          ) : (
            <FileText size={12} className="text-white/40" />
          )}
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          {item.type === 'file' && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void deleteFile(item.path);
              }}
              className="text-red-400 opacity-0 transition hover:text-red-300 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
        {item.type === 'directory' && expandedDirs.has(item.path) && item.children && (
          <div>{renderTree(item.children, depth + 1)}</div>
        )}
      </div>
    ));

  if (!projectId) {
    return <div className="p-4 text-xs text-white/40">No project selected</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[10px] font-semibold text-white/60">PROJECT FILES</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => void loadFiles()}
            disabled={loading}
            className="rounded p-1 text-white/40 hover:bg-white/10"
            title="Refresh"
            aria-label="Refresh project files"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => void createFile()}
            className="rounded p-1 text-white/40 hover:bg-white/10"
            title="New file"
            aria-label="Create project file"
          >
            <Plus size={10} />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {loading && files.length === 0 ? (
          <div className="p-4 text-center text-xs text-white/30">Loading files…</div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-xs text-white/30">No project files yet</div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
}
