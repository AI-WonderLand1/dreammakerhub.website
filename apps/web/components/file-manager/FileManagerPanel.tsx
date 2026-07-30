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

export default function FileManagerPanel({ projectId }: FileManagerPanelProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      logger.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFiles();
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
    const name = prompt('File name (e.g., styles.css):');
    if (!name || !projectId) return;
    try {
      await fetch(`/api/projects/${projectId}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: name, content: '' }),
      });
      loadFiles();
    } catch (err) {
      logger.error('Failed to create file:', err);
    }
  };

  const deleteFile = async (path: string) => {
    if (!projectId || !confirm(`Delete ${path}?`)) return;
    try {
      await fetch(`/api/projects/${projectId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: path }),
      });
      loadFiles();
    } catch (err) {
      logger.error('Failed to delete file:', err);
    }
  };

  const renderTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        <div
          className="flex items-center gap-1 py-1 px-2 hover:bg-white/5 rounded cursor-pointer text-xs"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => item.type === 'directory' ? toggleDir(item.path) : undefined}
        >
          {item.type === 'directory' ? (
            expandedDirs.has(item.path) ? <FolderOpen size={12} /> : <Folder size={12} />
          ) : (
            <FileText size={12} className="text-white/40" />
          )}
          <span className="truncate flex-1">{item.name}</span>
          {item.type === 'file' && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteFile(item.path); }}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
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
  };

  if (!projectId) {
    return (
      <div className="p-4 text-xs text-white/40">
        No project selected
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-[10px] font-semibold text-white/60">FILES</span>
        <div className="flex gap-1">
          <button
            onClick={loadFiles}
            disabled={loading}
            className="p-1 rounded hover:bg-white/10 text-white/40"
            title="Refresh"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={createFile}
            className="p-1 rounded hover:bg-white/10 text-white/40"
            title="New file"
          >
            <Plus size={10} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="p-4 text-xs text-white/30 text-center">
            No files yet
          </div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
}
